"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

async function requireOwnedRegistry(db: Db, registryId: string, userId: string) {
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, registryId));

  if (!registry || registry.ownerId !== userId) {
    throw new Error("Only the registry's owner can do that.");
  }

  return registry;
}

export async function addGift(registryId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireOwnedRegistry(db, registryId, userId);

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
  await requireOwnedRegistry(db, registryId, userId);

  const title = formData.get("title") as string;
  const eventDate = formData.get("eventDate") as string;

  await db
    .update(registries)
    .set({ title, eventDate: eventDate || null })
    .where(eq(registries.id, registryId));

  revalidatePath(`/registries/${registryId}`);
  redirect(`/registries/${registryId}`);
}

export async function updateGift(
  registryId: string,
  giftId: string,
  formData: FormData,
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireOwnedRegistry(db, registryId, userId);

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
  redirect(`/registries/${registryId}`);
}

export async function deleteGift(registryId: string, giftId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await requireOwnedRegistry(db, registryId, userId);

  await db
    .delete(gifts)
    .where(and(eq(gifts.id, giftId), eq(gifts.registryId, registryId)));

  revalidatePath(`/registries/${registryId}`);
}
