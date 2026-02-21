import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon serverless driver — HTTP mode for fast one-shot queries
// No client-side pooling needed: Neon handles it via PgBouncer
neonConfig.fetchConnectionCache = true; // reuse connections across requests

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

// Re-export the schema for convenience
export { schema };
