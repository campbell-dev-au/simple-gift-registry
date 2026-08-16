import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { registries, gifts } from "../../src/db/schema";

// A plain pg.Pool over the app's schema — deliberately not the app's
// getDb() — test setup/teardown shouldn't depend on the app's
// Vercel-Functions-specific pool lifecycle hook.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema: { registries, gifts } });

export async function createTestRegistry(ownerId: string, title: string) {
  const [registry] = await db
    .insert(registries)
    .values({ ownerId, title })
    .returning();
  return registry.id;
}

// Cascades to the registry's gifts (see the FK's onDelete: "cascade").
export async function deleteTestRegistry(id: string) {
  await db.delete(registries).where(eq(registries.id, id));
}

export async function createTestGift(registryId: string, name: string) {
  const [gift] = await db
    .insert(gifts)
    .values({ registryId, name })
    .returning();
  return gift.id;
}

export async function archiveTestRegistry(id: string) {
  await db.update(registries).set({ archivedAt: new Date() }).where(eq(registries.id, id));
}
