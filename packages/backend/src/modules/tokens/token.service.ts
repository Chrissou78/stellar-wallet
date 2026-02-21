import { db } from "../../db";
import { tokens, contractTokens, userTokens, syncState } from "../../db/schema";
import { cache } from "../../lib/cache";
import { eq, and, ilike, or, desc, asc, sql } from "drizzle-orm";
import { stellarClient } from "../../lib/stellar-client";
import * as StellarSdk from "@stellar/stellar-sdk";

type TokenSort = "rating" | "volume" | "trustlines" | "name";

interface SearchParams {
  query?: string;
  sortBy?: TokenSort;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

// ─── Sync cursor helpers (Neon instead of Redis) ───
async function getSyncCursor(key: string): Promise<string> {
  const [row] = await db
    .select()
    .from(syncState)
    .where(eq(syncState.key, key))
    .limit(1);
  return row?.value || "0";
}

async function setSyncCursor(key: string, value: string): Promise<void> {
  await db
    .insert(syncState)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: syncState.key,
      set: { value, updatedAt: new Date() },
    });
}

export class TokenService {
  // ─── Discover from Horizon ───
  async discoverFromHorizon(cursor?: string) {
    const assets = await stellarClient.horizon
      .assets()
      .limit(200)
      .order("desc")
      .cursor(cursor || "")
      .call();

    for (const asset of assets.records) {
      const assetType =
        asset.asset_code.length <= 4
          ? "credit_alphanum4"
          : "credit_alphanum12";

      await db
        .insert(tokens)
        .values({
          assetType,
          assetCode: asset.asset_code,
          assetIssuer: asset.asset_issuer,
          totalSupply: asset.amount,
          trustlineCount: asset.num_accounts,
        })
        .onConflictDoUpdate({
          target: [tokens.assetCode, tokens.assetIssuer],
          set: {
            totalSupply: sql`COALESCE(EXCLUDED.total_supply, ${tokens.totalSupply})`,
            trustlineCount: sql`COALESCE(EXCLUDED.trustline_count, ${tokens.trustlineCount})`,
            updatedAt: new Date(),
          },
        });
    }

    return assets.records.length;
  }

  // ─── Enrich from StellarExpert ───
  async enrichFromStellarExpert() {
    const cursor = await getSyncCursor("token-sync:expert:cursor");

    const res = await fetch(
      `https://api.stellar.expert/explorer/public/asset?order=desc&sort=rating&limit=50&cursor=${cursor}`
    );
    const data = await res.json();

    for (const record of data._embedded.records) {
      const [code, issuerWithFlag] = record.asset.split("-");
      const issuer = issuerWithFlag?.split("-")[0];
      if (!issuer) continue;

      await db
        .update(tokens)
        .set({
          homeDomain: record.domain || undefined,
          tomlName: record.tomlInfo?.name || undefined,
          tomlOrg: record.tomlInfo?.orgName || undefined,
          ratingAge: record.rating?.age,
          ratingTrades: record.rating?.trades,
          ratingPayments: record.rating?.payments,
          ratingTrustlines: record.rating?.trustlines,
          ratingVolume: record.rating?.volume7d,
          ratingLiquidity: record.rating?.liquidity,
          ratingInterop: record.rating?.interop,
          ratingAverage: record.rating?.average?.toString(),
          tradeCount: record.trades,
          paymentCount: record.payments,
          totalSupply: record.supply?.toString(),
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(tokens.assetCode, code), eq(tokens.assetIssuer, issuer))
        );
    }

    if (data._embedded.records.length > 0) {
      const last = data._embedded.records.at(-1);
      await setSyncCursor(
        "token-sync:expert:cursor",
        last.paging_token.toString()
      );
    }
  }

  // ─── Search tokens ───
  async search(params: SearchParams) {
    const {
      query,
      sortBy = "rating",
      verified,
      limit = 50,
      offset = 0,
    } = params;

    const conditions = [eq(tokens.isSpam, false)];

    if (query) {
      conditions.push(
        or(
          ilike(tokens.assetCode, `%${query}%`),
          ilike(tokens.tomlName, `%${query}%`),
          ilike(tokens.homeDomain, `%${query}%`)
        )!
      );
    }

    if (verified) {
      conditions.push(eq(tokens.isVerified, true));
    }

    const sortMap = {
      rating: desc(tokens.ratingAverage),
      volume: desc(tokens.volume7d),
      trustlines: desc(tokens.trustlineCount),
      name: asc(tokens.assetCode),
    };

    return db
      .select()
      .from(tokens)
      .where(and(...conditions))
      .orderBy(sortMap[sortBy])
      .limit(limit)
      .offset(offset);
  }

  // ─── Get single token with full detail ───
  async getDetail(code: string, issuer: string) {
    const cacheKey = `token:${code}:${issuer}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [token] = await db
      .select()
      .from(tokens)
      .leftJoin(
        contractTokens,
        and(
          eq(contractTokens.assetCode, tokens.assetCode),
          eq(contractTokens.assetIssuer, tokens.assetIssuer)
        )
      )
      .where(and(eq(tokens.assetCode, code), eq(tokens.assetIssuer, issuer)))
      .limit(1);

    if (!token) return null;

    const [orderbook, pools] = await Promise.all([
      this.getOrderbook(code, issuer),
      this.getRelatedPools(code, issuer),
    ]);

    const result = {
      ...token.tokens,
      contractToken: token.contract_tokens,
      orderbook,
      liquidityPools: pools,
    };

    await cache.set(cacheKey, result, 300); // 5 min in-memory
    return result;
  }

  // ─── Featured tokens ───
  async getFeatured() {
    const cacheKey = "tokens:featured";
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await db
      .select()
      .from(tokens)
      .where(and(eq(tokens.isFeatured, true), eq(tokens.isSpam, false)))
      .orderBy(desc(tokens.ratingAverage))
      .limit(20);

    await cache.set(cacheKey, result, 600); // 10 min in-memory
    return result;
  }

  // ─── User's enriched token list ───
  async getUserTokens(publicKey: string) {
    const account = await stellarClient.horizon.loadAccount(publicKey);

    const balances = account.balances.map((b: any) => ({
      assetCode: b.asset_type === "native" ? "XLM" : b.asset_code,
      assetIssuer: b.asset_type === "native" ? null : b.asset_issuer,
      balance: b.balance,
      assetType: b.asset_type,
    }));

    const enriched = await Promise.all(
      balances.map(async (b) => {
        if (!b.assetIssuer) {
          return {
            ...b,
            name: "Stellar Lumens",
            symbol: "XLM",
            isNative: true,
          };
        }

        const [tokenMeta] = await db
          .select()
          .from(tokens)
          .where(
            and(
              eq(tokens.assetCode, b.assetCode),
              eq(tokens.assetIssuer, b.assetIssuer)
            )
          )
          .limit(1);

        const [prefs] = tokenMeta
          ? await db
              .select()
              .from(userTokens)
              .where(
                and(
                  eq(userTokens.publicKey, publicKey),
                  eq(userTokens.tokenId, tokenMeta.id)
                )
              )
              .limit(1)
          : [null];

        return {
          ...b,
          ...(tokenMeta || {}),
          isFavorite: prefs?.isFavorite ?? false,
          isHidden: prefs?.isHidden ?? false,
        };
      })
    );

    return enriched.filter((t) => !t.isHidden);
  }

  // ─── Toggle favorite ───
  async toggleFavorite(publicKey: string, tokenId: number) {
    const [existing] = await db
      .select()
      .from(userTokens)
      .where(
        and(
          eq(userTokens.publicKey, publicKey),
          eq(userTokens.tokenId, tokenId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(userTokens)
        .set({ isFavorite: !existing.isFavorite })
        .where(eq(userTokens.id, existing.id));
      return { ...existing, isFavorite: !existing.isFavorite };
    }

    const [inserted] = await db
      .insert(userTokens)
      .values({ publicKey, tokenId, isFavorite: true })
      .returning();
    return inserted;
  }

  // ─── Orderbook helper ───
  private async getOrderbook(code: string, issuer: string) {
    try {
      const ob = await stellarClient.horizon
        .orderbook(
          new StellarSdk.Asset(code, issuer),
          StellarSdk.Asset.native()
        )
        .call();

      return {
        bids: ob.bids.slice(0, 10),
        asks: ob.asks.slice(0, 10),
        spread:
          ob.asks[0] && ob.bids[0]
            ? (
                ((parseFloat(ob.asks[0].price) -
                  parseFloat(ob.bids[0].price)) /
                  parseFloat(ob.asks[0].price)) *
                100
              ).toFixed(2)
            : null,
      };
    } catch {
      return null;
    }
  }

  // ─── Liquidity pools helper ───
  private async getRelatedPools(code: string, issuer: string) {
    try {
      const pools = await stellarClient.horizon
        .liquidityPools()
        .forAssets(new StellarSdk.Asset(code, issuer))
        .limit(10)
        .call();

      return pools.records.map((p: any) => ({
        id: p.id,
        reserves: p.reserves,
        totalShares: p.total_shares,
        totalTrustlines: p.total_trustlines,
      }));
    } catch {
      return [];
    }
  }
}