import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { registryInvitations } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

// Shared by both server actions (as an authorization gate) and pages (to
// decide what to render) so "who can manage this registry" — owner or an
// accepted co-owner — stays a single definition.
export async function canManageRegistry(
  db: Db,
  registryOwnerId: string,
  registryId: string,
  userId: string | null,
) {
  if (!userId) return false;
  if (userId === registryOwnerId) return true;

  const [coOwner] = await db
    .select({ id: registryInvitations.id })
    .from(registryInvitations)
    .where(
      and(
        eq(registryInvitations.registryId, registryId),
        eq(registryInvitations.status, "accepted"),
        eq(registryInvitations.acceptedByUserId, userId),
      ),
    );

  return !!coOwner;
}
