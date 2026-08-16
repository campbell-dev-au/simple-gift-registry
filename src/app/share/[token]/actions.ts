"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
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

export async function claimGift(
  token: string,
  giftId: string,
  formData: FormData,
) {
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return;

  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  await db
    .update(gifts)
    .set({ claimedByName: name, claimedAt: new Date() })
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registry.id)));

  revalidatePath(`/share/${token}`);
}

export async function unclaimGift(token: string, giftId: string) {
  const db = getDb();
  const registry = await requireRegistryByShareToken(db, token);

  await db
    .update(gifts)
    .set({ claimedByName: null, claimedAt: null })
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registry.id)));

  revalidatePath(`/share/${token}`);
}
