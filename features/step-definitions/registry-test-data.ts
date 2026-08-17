import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import {
  registries,
  gifts,
  giftClaims,
  registryInvitations,
  registrySaves,
} from "../../src/db/schema";

// A plain pg.Pool over the app's schema — deliberately not the app's
// getDb() — test setup/teardown shouldn't depend on the app's
// Vercel-Functions-specific pool lifecycle hook.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, {
  schema: { registries, gifts, giftClaims, registryInvitations, registrySaves },
});

export async function createTestRegistry(ownerId: string, title: string) {
  const [registry] = await db
    .insert(registries)
    .values({ ownerId, title })
    .returning();
  return registry;
}

// Cascades to the registry's gifts (see the FK's onDelete: "cascade").
export async function deleteTestRegistry(id: string) {
  await db.delete(registries).where(eq(registries.id, id));
}

export async function createTestGift(
  registryId: string,
  name: string,
  quantity: number = 1,
) {
  const [gift] = await db
    .insert(gifts)
    .values({ registryId, name, quantity })
    .returning();
  return gift.id;
}

export async function archiveTestRegistry(id: string) {
  await db.update(registries).set({ archivedAt: new Date() }).where(eq(registries.id, id));
}

export async function saveTestRegistry(
  registryId: string,
  savedByUserId: string,
) {
  await db.insert(registrySaves).values({ registryId, savedByUserId });
}

export async function claimTestGift(
  registryId: string,
  giftName: string,
  claimantUserId: string,
  quantity: number = 1,
) {
  const [gift] = await db
    .select({ id: gifts.id })
    .from(gifts)
    .where(and(eq(gifts.registryId, registryId), eq(gifts.name, giftName)));

  await db
    .insert(giftClaims)
    .values({ giftId: gift.id, claimedByUserId: claimantUserId, quantity });
}

// A fake but distinct id — used when a scenario needs "some other person"
// on the invitation (invitedByUserId or acceptedByUserId) without that
// person ever needing to actually sign in, mirroring the same pattern
// claimTestGift/GUEST_GIFT_NAME already use for "claimed by someone else".
const OTHER_PERSON_USER_ID = "user_someone_else_not_signed_in";

export async function createTestInvitation(
  registryId: string,
  email: string,
  options: {
    status?: "pending" | "accepted";
    invitedByUserId?: string;
    acceptedByUserId?: string;
  } = {},
) {
  const [invitation] = await db
    .insert(registryInvitations)
    .values({
      registryId,
      email,
      invitedByUserId: options.invitedByUserId ?? OTHER_PERSON_USER_ID,
      status: options.status ?? "pending",
      acceptedByUserId: options.acceptedByUserId,
    })
    .returning();
  return invitation.id;
}
