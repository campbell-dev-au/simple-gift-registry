import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (non-pooled) connection — pooled connections
    // route through PgBouncer, which doesn't support session-level operations.
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
