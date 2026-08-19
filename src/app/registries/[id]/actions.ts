"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, or, count } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts, registryInvitations } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";
import {
  encryptSharePassword,
  sharePasswordKeyConfigured,
} from "@/lib/share-password";
import { isUuid } from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";
import {
  maxLengthError,
  TITLE_MAX_LENGTH,
  GIFT_NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  REGISTRY_NOTES_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  SHARE_PASSWORD_MIN_LENGTH,
  SHARE_PASSWORD_MAX_LENGTH,
  QUANTITY_MAX,
  GIFT_COUNT_MAX,
  INVITE_COUNT_MAX,
} from "@/lib/field-limits";

type Db = ReturnType<typeof getDb>;

// Owner or accepted co-owner — the two have equal management rights over
// gifts and registry details (see docs/stories/invite-co-owner.md).
async function requireRegistryAccess(db: Db, registryId: string, userId: string) {
  if (!isUuid(registryId)) throw new Error("Registry not found.");

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
  if (!isUuid(registryId)) throw new Error("Registry not found.");

  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, registryId));

  if (!registry || registry.ownerId !== userId) {
    throw new Error("Only the registry's original owner can do that.");
  }

  return registry;
}

export async function addGift(
  registryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const name = (formData.get("name") as string | null) ?? "";
  const notes = (formData.get("notes") as string | null) ?? "";
  const quantity = Number.parseInt(formData.get("quantity") as string, 10);
  if (!name.trim()) return { error: "Give the gift a name." };
  const lengthError =
    maxLengthError(name, GIFT_NAME_MAX_LENGTH, "Gift name") ??
    maxLengthError(notes, NOTES_MAX_LENGTH, "Notes");
  if (lengthError) return { error: lengthError };

  const [{ giftCount }] = await db
    .select({ giftCount: count() })
    .from(gifts)
    .where(eq(gifts.registryId, registryId));
  if (giftCount >= GIFT_COUNT_MAX) {
    return {
      error: `This registry already has the maximum of ${GIFT_COUNT_MAX} gifts.`,
    };
  }

  await db.insert(gifts).values({
    registryId,
    name,
    notes: notes || null,
    quantity:
      Number.isInteger(quantity) && quantity > 0
        ? Math.min(quantity, QUANTITY_MAX)
        : 1,
  });

  revalidatePath(`/registries/${registryId}`);
  return null;
}

export async function updateRegistry(
  registryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const title = (formData.get("title") as string | null) ?? "";
  const eventDate = (formData.get("eventDate") as string | null) ?? "";
  const notes = (formData.get("notes") as string | null) ?? "";
  if (!title.trim()) return { error: "Give the registry a title." };
  const lengthError =
    maxLengthError(title, TITLE_MAX_LENGTH, "Registry title") ??
    maxLengthError(notes, REGISTRY_NOTES_MAX_LENGTH, "Notes");
  if (lengthError) return { error: lengthError };
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: "That doesn't look like a valid event date." };
  }

  await db
    .update(registries)
    .set({ title, eventDate: eventDate || null, notes: notes || null })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  revalidatePath("/registries");
  return null;
}

export async function updateGift(
  registryId: string,
  giftId: string,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);
  if (!isUuid(giftId)) return { error: "This gift is no longer on the registry." };

  const name = (formData.get("name") as string | null) ?? "";
  const notes = (formData.get("notes") as string | null) ?? "";
  const quantity = Number.parseInt(formData.get("quantity") as string, 10);
  if (!name.trim()) return { error: "Give the gift a name." };
  const lengthError =
    maxLengthError(name, GIFT_NAME_MAX_LENGTH, "Gift name") ??
    maxLengthError(notes, NOTES_MAX_LENGTH, "Notes");
  if (lengthError) return { error: lengthError };

  await db
    .update(gifts)
    .set({
      name,
      notes: notes || null,
      quantity:
        Number.isInteger(quantity) && quantity > 0
          ? Math.min(quantity, QUANTITY_MAX)
          : 1,
    })
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registryId)));

  revalidatePath(`/registries/${registryId}`);
  return null;
}

export async function deleteGift(registryId: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);
  if (!isUuid(giftId)) return;

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

// Sets or replaces the share-page password. Replacing also invalidates
// every guest's existing unlock cookie — the cookie is HMAC-keyed by the
// stored ciphertext, which changes on every set (see
// src/lib/share-password.ts).
export async function setSharePassword(
  registryId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  if (!sharePasswordKeyConfigured()) {
    return {
      error:
        "Share passwords aren't available right now — the server is missing its SHARE_PASSWORD_KEY.",
    };
  }

  const password = (formData.get("password") as string | null) ?? "";
  if (password.length < SHARE_PASSWORD_MIN_LENGTH) {
    return {
      error: `The password needs at least ${SHARE_PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  const lengthError = maxLengthError(
    password,
    SHARE_PASSWORD_MAX_LENGTH,
    "Password",
  );
  if (lengthError) return { error: lengthError };

  await db
    .update(registries)
    .set({ sharePasswordEncrypted: encryptSharePassword(password) })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  return { ok: true };
}

export async function removeSharePassword(registryId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  await db
    .update(registries)
    .set({ sharePasswordEncrypted: null })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
}

// Any owner or co-owner can invite further co-owners — full parity, not
// just the original owner (see docs/stories/invite-co-owner.md). Signature
// shaped for useActionState (prevState before formData) so the form can
// confirm success and surface a bad email inline instead of throwing.
export async function inviteCoOwner(
  registryId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);

  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > EMAIL_MAX_LENGTH) {
    return { error: "That doesn't look like a valid email address." };
  }

  const [existing] = await db
    .select({ id: registryInvitations.id })
    .from(registryInvitations)
    .where(
      and(
        eq(registryInvitations.registryId, registryId),
        eq(registryInvitations.email, email),
        or(
          eq(registryInvitations.status, "pending"),
          eq(registryInvitations.status, "accepted"),
        ),
      ),
    );

  // An already-pending (or already-accepted) invitation counts as success —
  // it's idempotent, and the lists on the page show the state either way.
  if (!existing) {
    const [{ activeCount }] = await db
      .select({ activeCount: count() })
      .from(registryInvitations)
      .where(
        and(
          eq(registryInvitations.registryId, registryId),
          or(
            eq(registryInvitations.status, "pending"),
            eq(registryInvitations.status, "accepted"),
          ),
        ),
      );
    if (activeCount >= INVITE_COUNT_MAX) {
      return {
        error: `A registry can have at most ${INVITE_COUNT_MAX} co-owners and pending invitations.`,
      };
    }

    // The partial unique index on (registry_id, email) backs up the check
    // above; a double-submit race lands here and is safely a no-op.
    await db
      .insert(registryInvitations)
      .values({
        registryId,
        email,
        invitedByUserId: userId,
      })
      .onConflictDoNothing();
  }

  revalidatePath(`/registries/${registryId}`);
  return { ok: true };
}

export async function cancelInvitation(registryId: string, invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireRegistryAccess(db, registryId, userId);
  if (!isUuid(invitationId)) return;

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
  if (!isUuid(invitationId)) return;

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
