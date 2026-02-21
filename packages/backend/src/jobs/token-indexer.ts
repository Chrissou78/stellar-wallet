import { TokenService } from "../modules/tokens/token.service";

const tokenService = new TokenService();

export async function runTokenIndexer() {
  console.log("[TokenIndexer] Starting sync...");

  try {
    // 1. Discover new assets from Horizon
    const count = await tokenService.discoverFromHorizon();
    console.log(`[TokenIndexer] Discovered ${count} assets from Horizon`);

    // 2. Enrich with StellarExpert ratings + metadata
    await tokenService.enrichFromStellarExpert();
    console.log("[TokenIndexer] Enriched from StellarExpert");
  } catch (error) {
    console.error("[TokenIndexer] Error:", error);
  }

  console.log("[TokenIndexer] Sync complete.");
}
