"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";

async function requireRegistryByShareToken(
  db: ReturnType<typeof getDb>,
  token: string,
) {
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.shareToken, token));

  if (!registry) {
    throw new Error("Registry not found.");
  }

  return registry;
}

export async function claimGift(token: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  // isNull(claimedAt) guards against a race where two guests submit the
  // claim at nearly the same time — the loser's update just affects 0 rows
  // instead of silently stealing the winner's claim.
  await db
    .update(gifts)
    .set({ claimedByUserId: userId, claimedAt: new Date() })
    .where(
      and(
        eq(gifts.id, giftId),
        eq(gifts.registryId, registry.id),
        isNull(gifts.claimedAt),
      ),
    );

  revalidatePath(`/share/${token}`);
}

export async function unclaimGift(token: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/share/${token}`);

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  // Scoped to claimedByUserId = the current user — this is the actual
  // authorization check, not just a hidden button. Someone else's claim
  // simply doesn't match the WHERE clause and nothing happens.
  await db
    .update(gifts)
    .set({ claimedByUserId: null, claimedAt: null })
    .where(
      and(
        eq(gifts.id, giftId),
        eq(gifts.registryId, registry.id),
        eq(gifts.claimedByUserId, userId),
      ),
    );

  revalidatePath(`/share/${token}`);
}
