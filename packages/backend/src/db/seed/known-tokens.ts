import "dotenv/config";
import { db } from "../index";
import { tokens } from "../schema";
import { sql } from "drizzle-orm";

const KNOWN_TOKENS = [
  {
    assetType: "native",
    assetCode: "XLM",
    assetIssuer: null,
    tomlName: "Stellar Lumens",
    tomlOrg: "Stellar Development Foundation",
    tomlImage: "https://cryptologos.cc/logos/stellar-xlm-logo.png",
    ratingAverage: "10.0",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "yXLM",
    assetIssuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    homeDomain: "ultracapital.xyz",
    tomlName: "Yield XLM",
    tomlOrg: "Ultra Capital LLC dba Ultra Capital",
    tomlImage: "https://ultracapital.xyz/static/images/icons/yXLM.png",
    anchorAsset: "XLM",
    anchorType: "crypto",
    ratingAverage: "9.7",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "USDC",
    assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    homeDomain: "circle.com",
    tomlName: "USD Coin",
    tomlOrg: "Circle Internet Financial, LLC",
    tomlImage: "https://www.centre.io/images/usdc/usdc-icon-86074d9d49.png",
    anchorAsset: "USD",
    anchorType: "fiat",
    ratingAverage: "9.0",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "BTC",
    assetIssuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    homeDomain: "ultracapital.xyz",
    tomlName: "Bitcoin",
    tomlOrg: "Ultra Capital LLC dba Ultra Capital",
    tomlImage: "https://ultracapital.xyz/static/images/icons/BTC.png",
    anchorAsset: "BTC",
    anchorType: "crypto",
    ratingAverage: "8.3",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "AQUA",
    assetIssuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67TKA",
    homeDomain: "aqua.network",
    tomlName: "Aquarius",
    tomlOrg: "Aquarius",
    tomlImage: "https://aqua.network/assets/img/aqua-logo.png",
    ratingAverage: "7.8",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "EURC",
    assetIssuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP",
    homeDomain: "circle.com",
    tomlName: "Euro Coin",
    tomlOrg: "Circle",
    tomlImage: "https://www.circle.com/hubfs/Brand/EURC/EURC-icon.png",
    anchorAsset: "EUR",
    anchorType: "fiat",
    ratingAverage: "7.5",
    isVerified: true,
    isFeatured: true,
  },
  {
    assetType: "credit_alphanum4",
    assetCode: "ETH",
    assetIssuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    homeDomain: "ultrastellar.com",
    tomlName: "Ethereum",
    tomlOrg: "Ultra Stellar LLC",
    tomlImage: "https://ultracapital.xyz/static/images/icons/ETH.png",
    ratingAverage: "7.0",
    isVerified: true,
    isFeatured: true,
  },
];


async function seed() {
  console.log("Seeding known tokens...");

  for (const token of KNOWN_TOKENS) {
    await db
      .insert(tokens)
      .values(token)
      .onConflictDoUpdate({
        target: [tokens.assetCode, tokens.assetIssuer],
        set: {
          tomlImage: token.tomlImage,
          tomlName: token.tomlName,
          tomlOrg: token.tomlOrg,
          homeDomain: token.homeDomain ?? null,
          anchorAsset: token.anchorAsset ?? null,
          anchorType: token.anchorType ?? null,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${token.assetCode}`);
  }

  console.log("Done! Seeded", KNOWN_TOKENS.length, "tokens.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
