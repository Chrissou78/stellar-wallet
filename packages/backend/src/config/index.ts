import "dotenv/config";

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3001", 10),
  STELLAR_NETWORK: (process.env.STELLAR_NETWORK || "testnet") as "testnet" | "public",
  HORIZON_URL:
    process.env.HORIZON_URL || "https://horizon-testnet.stellar.org",
  SOROBAN_RPC_URL:
    process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  WEB_APP_URL: process.env.WEB_APP_URL || "http://localhost:5173",
};
