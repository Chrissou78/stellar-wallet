import "dotenv/config";
import { db } from "../index";
import { tokens } from "../schema";

const KNOWN_TOKENS = [
  {
    assetType: "native" as const,
    assetCode: "XLM",
    assetIssuer: null,
    tomlName: "Stellar Lumens",
    tomlOrg: "Stellar Development Foundation",
    tomlImage: "https://assets.stellar.org/icons/xlm.png",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "10",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "USDC",
    assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    homeDomain: "centre.io",
    tomlName: "USD Coin",
    tomlOrg: "Centre Consortium",
    anchorAsset: "USD",
    anchorType: "fiat",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "8.1",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "yXLM",
    assetIssuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    homeDomain: "ultrastellar.com",
    tomlName: "Yield XLM",
    tomlOrg: "Ultra Stellar LLC",
    anchorAsset: "XLM",
    anchorType: "crypto",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "9",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "EURC",
    assetIssuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP",
    homeDomain: "circle.com",
    tomlName: "Euro Coin",
    tomlOrg: "Circle",
    anchorAsset: "EUR",
    anchorType: "fiat",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "7.5",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "AQUA",
    assetIssuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67TKA",
    homeDomain: "aqua.network",
    tomlName: "Aquarius",
    tomlOrg: "Aquarius",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "7.8",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "BTC",
    assetIssuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    homeDomain: "ultrastellar.com",
    tomlName: "Bitcoin",
    tomlOrg: "Ultra Stellar LLC",
    anchorAsset: "BTC",
    anchorType: "crypto",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "7.2",
  },
  {
    assetType: "credit_alphanum4" as const,
    assetCode: "ETH",
    assetIssuer: "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    homeDomain: "ultrastellar.com",
    tomlName: "Ethereum",
    tomlOrg: "Ultra Stellar LLC",
    anchorAsset: "ETH",
    anchorType: "crypto",
    isVerified: true,
    isFeatured: true,
    ratingAverage: "7.0",
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
          tomlName: token.tomlName,
          tomlOrg: token.tomlOrg,
          homeDomain: token.homeDomain,
          isVerified: token.isVerified,
          isFeatured: token.isFeatured,
          ratingAverage: token.ratingAverage,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded ${KNOWN_TOKENS.length} tokens.`);
  process.exit(0);
}

seed().catch(console.error);
