import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

// Lazy singleton: reading DATABASE_URL at module load time would crash
// `next build` before env vars are configured. A plain function (not a
// Proxy — see vercel-storage skill) keeps the client's shape untouched for
// anything that inspects it.
function createDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) _db = createDb();
  return _db;
}
