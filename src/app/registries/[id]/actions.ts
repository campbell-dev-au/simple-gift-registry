"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts, registryInvitations } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";

type Db = ReturnType<typeof getDb>;

// Owner or accepted co-owner — the two have equal management rights over
// gifts and registry details (see docs/stories/invite-co-owner.md).
async function requireRegistryAccess(db: Db, registryId: string, userId: string) {
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, registryId));

  if (!registry || !(await canManageRegistry(db, registry.ownerId, registry.id, userId))) {
    throw new Error("Only the registry's owner or an invited co-owner can do that.");
  }

  return registry;
}

// Stricter than requireRegistryAccess — removing a co-owner is reserved for
// the person who created the registry, not any co-owner (deliberate: a
// co-owner shouldn't be able to remove the original owner or each other).
async function requirePrimaryOwner(db: Db, registryId: string, userId: string) {
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, registryId));

  if (!registry || registry.ownerId !== userId) {
    throw new Error("Only the registry's original owner can do that.");
  }

  return registry;
}

export async function addGift(registryId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const name = formData.get("name") as string;
  const notes = formData.get("notes") as string;
  const quantity = Number.parseInt(formData.get("quantity") as string, 10);

  await db.insert(gifts).values({
    registryId,
    name,
    notes: notes || null,
    quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
  });

  revalidatePath(`/registries/${registryId}`);
}

export async function updateRegistry(registryId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const title = formData.get("title") as string;
  const eventDate = formData.get("eventDate") as string;

  await db
    .update(registries)
    .set({ title, eventDate: eventDate || null })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  revalidatePath("/registries");
}

export async function updateGift(
  registryId: string,
  giftId: string,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const name = formData.get("name") as string;
  const notes = formData.get("notes") as string;
  const quantity = Number.parseInt(formData.get("quantity") as string, 10);

  await db
    .update(gifts)
    .set({
      name,
      notes: notes || null,
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
    })
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registryId)));

  revalidatePath(`/registries/${registryId}`);
}

export async function deleteGift(registryId: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .delete(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registryId)));

  revalidatePath(`/registries/${registryId}`);
}

export async function archiveRegistry(registryId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .update(registries)
    .set({ archivedAt: new Date() })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  revalidatePath("/registries");
}

export async function unarchiveRegistry(registryId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .update(registries)
    .set({ archivedAt: null })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  revalidatePath("/registries");
}

// Issues a new share token, invalidating the old /share/[token] link — the
// owner's recourse if a link gets shared more widely than intended.
export async function regenerateShareLink(registryId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .update(registries)
    .set({ shareToken: randomUUID() })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
}

// Any owner or co-owner can invite further co-owners — full parity, not
// just the original owner (see docs/stories/invite-co-owner.md).
export async function inviteCoOwner(registryId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email address.");
  }

  const [existing] = await db
    .select({ id: registryInvitations.id })
    .from(registryInvitations)
    .where(
      and(
        eq(registryInvitations.registryId, registryId),
        eq(registryInvitations.email, email),
        eq(registryInvitations.status, "pending"),
      ),
    );

  if (!existing) {
    await db.insert(registryInvitations).values({
      registryId,
      email,
      invitedByUserId: userId,
    });
  }

  revalidatePath(`/registries/${registryId}`);
}

export async function cancelInvitation(registryId: string, invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .delete(registryInvitations)
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.registryId, registryId),
        eq(registryInvitations.status, "pending"),
      ),
    );

  revalidatePath(`/registries/${registryId}`);
}

// Off by default (see reveal_claims in src/db/schema.ts) — the manage page
// gates turning this on behind a confirmation dialog since an owner is
// often also a recipient. Turning it back off needs no such confirmation.
export async function setClaimVisibility(registryId: string, reveal: boolean) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .update(registries)
    .set({ revealClaims: reveal })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  revalidatePath("/registries");
}

// Reserved for the original owner (requirePrimaryOwner), not any co-owner —
// see the note on requirePrimaryOwner above.
export async function removeCoOwner(registryId: string, invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requirePrimaryOwner(db, registryId, userId);

  await db
    .delete(registryInvitations)
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.registryId, registryId),
        eq(registryInvitations.status, "accepted"),
      ),
    );

  revalidatePath(`/registries/${registryId}`);
}
