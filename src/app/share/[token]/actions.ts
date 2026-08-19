"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq, and, sql, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registrySaves } from "@/db/schema";
import { QUANTITY_MAX, SHARE_PASSWORD_MAX_LENGTH } from "@/lib/field-limits";
import { isUuid } from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";
import {
  hasShareAccess,
  shareAccessCookieName,
  shareAccessCookieValue,
  verifySharePassword,
} from "@/lib/share-password";

async function requireRegistryByShareToken(
  db: ReturnType<typeof getDb>,
  token: string,
) {
  if (!isUuid(token)) throw new Error("Registry not found.");

  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.shareToken, token));

  if (!registry) {
    throw new Error("Registry not found.");
  }

  return registry;
}

// The share page renders a password gate when the registry is protected
// (see hasShareAccess) — but the gate is just UI. Every action reachable
// from the share page re-checks the unlock cookie here, so a raw request
// with the token but without the password gets nowhere.
async function requireShareUnlock(registry: {
  id: string;
  sharePasswordEncrypted: string | null;
}) {
  const cookieStore = await cookies();
  if (!hasShareAccess(registry, cookieStore)) {
    throw new Error("This registry is password protected.");
  }
}

// Verifies the share password and sets the unlock cookie the rest of the
// share actions (and the page) check. Signature shaped for useActionState.
export async function unlockShareRegistry(
  token: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);
  if (!registry.sharePasswordEncrypted) return null;

  const password = (formData.get("password") as string | null) ?? "";
  if (
    !password ||
    password.length > SHARE_PASSWORD_MAX_LENGTH ||
    !verifySharePassword(password, registry.sharePasswordEncrypted)
  ) {
    // Verification itself is a cheap decrypt-and-compare, so this delay is
    // the only per-attempt cost an online guesser pays.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: "That password isn't right — check with whoever sent you the link." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    shareAccessCookieName(registry.id),
    shareAccessCookieValue(registry.id, registry.sharePasswordEncrypted),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  revalidatePath(`/share/${token}`);
  return null;
}

export type ClaimResult = { error: string } | null;

// Signature shaped for useActionState (prevState before formData) so the
// share page can show the outcome inline — most importantly when a claim
// loses a race and would otherwise vanish without a trace.
export async function claimGift(
  token: string,
  giftId: string,
  _prevState: ClaimResult,
  formData: FormData,
): Promise<ClaimResult> {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  if (!isUuid(giftId)) {
    return { error: "This gift is no longer on the registry." };
  }

  const requestedQuantity = Number.parseInt(
    formData.get("quantity") as string,
    10,
  );
  if (
    !Number.isInteger(requestedQuantity) ||
    requestedQuantity < 1 ||
    requestedQuantity > QUANTITY_MAX
  ) {
    return { error: "Enter a valid quantity to claim." };
  }

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);
  await requireShareUnlock(registry);
  if (registry.archivedAt) {
    return { error: "This registry has been archived and isn't accepting claims." };
  }

  // The FOR UPDATE lock on the gift row serializes concurrent claimants of
  // the same gift, so the "already claimed" sum read below can't be stale
  // by the time we decide whether this claim still fits — the loser of a
  // race sees a remaining count too small for their request and gets told
  // so, instead of overselling the gift.
  let result: ClaimResult = null;
  await db.transaction(async (tx) => {
    const [gift] = await tx
      .select({ quantity: gifts.quantity })
      .from(gifts)
      .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registry.id)))
      .for("update");

    if (!gift) {
      result = { error: "This gift is no longer on the registry." };
      return;
    }

    const [{ claimed }] = await tx
      .select({
        claimed: sql<number>`coalesce(sum(${giftClaims.quantity}), 0)`,
      })
      .from(giftClaims)
      .where(eq(giftClaims.giftId, giftId));

    const remaining = gift.quantity - Number(claimed);
    if (requestedQuantity > remaining) {
      result = {
        error:
          remaining <= 0
            ? "Someone else just claimed the last one."
            : `Someone else just claimed some — only ${remaining} left.`,
      };
      return;
    }

    await tx.insert(giftClaims).values({
      giftId,
      claimedByUserId: userId,
      quantity: requestedQuantity,
    });
  });

  revalidatePath(`/share/${token}`);
  return result;
}

// Bookmarking your own registry via its share link is a no-op, not an
// error — nothing stops an owner from opening the link, so this just
// silently declines to add a redundant row instead of surfacing a message
// for something the UI shouldn't offer them in the first place.
export async function saveRegistry(token: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);
  await requireShareUnlock(registry);
  if (userId === registry.ownerId) return;

  await db
    .insert(registrySaves)
    .values({ registryId: registry.id, savedByUserId: userId })
    .onConflictDoNothing();

  revalidatePath(`/share/${token}`);
  revalidatePath("/registries");
}

export async function unsaveRegistry(token: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  await db
    .delete(registrySaves)
    .where(
      and(
        eq(registrySaves.registryId, registry.id),
        eq(registrySaves.savedByUserId, userId),
      ),
    );

  revalidatePath(`/share/${token}`);
  revalidatePath("/registries");
}

export async function unclaimGift(token: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  if (!isUuid(giftId)) return;

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  // Scoped to claimedByUserId = the current user — this is the actual
  // authorization check, not just a hidden button. Someone else's claim
  // simply doesn't match the WHERE clause and nothing happens. The
  // registry-scoped subquery mirrors requireRegistryByShareToken's role in
  // claimGift, keeping a guest from unclaiming a gift on a registry that
  // isn't behind this share token.
  await db.delete(giftClaims).where(
    and(
      eq(giftClaims.giftId, giftId),
      eq(giftClaims.claimedByUserId, userId),
      inArray(
        giftClaims.giftId,
        db
          .select({ id: gifts.id })
          .from(gifts)
          .where(eq(gifts.registryId, registry.id)),
      ),
    ),
  );

  revalidatePath(`/share/${token}`);
}
