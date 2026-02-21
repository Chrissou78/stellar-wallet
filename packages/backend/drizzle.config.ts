import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL_DIRECT) {
  throw new Error("DATABASE_URL_DIRECT is required for migrations");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use DIRECT (unpooled) connection for migrations
    // PgBouncer doesn't support DDL/migration statements well
    url: process.env.DATABASE_URL_DIRECT,
  },
});
