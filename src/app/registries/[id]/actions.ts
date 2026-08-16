"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";

export async function addGift(registryId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, registryId));

  if (!registry || registry.ownerId !== userId) {
    throw new Error("Only the registry's owner can add gifts to it.");
  }

  const name = formData.get("name") as string;
  const notes = formData.get("notes") as string;

  await db.insert(gifts).values({
    registryId,
    name,
    notes: notes || null,
  });

  revalidatePath(`/registries/${registryId}`);
}
