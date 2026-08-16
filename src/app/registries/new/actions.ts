"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { registries } from "@/db/schema";

export async function createRegistry(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const title = formData.get("title") as string;
  const eventDate = formData.get("eventDate") as string;

  const [registry] = await getDb()
    .insert(registries)
    .values({
      ownerId: userId,
      title,
      eventDate: eventDate || null,
    })
    .returning();

  redirect(`/registries/${registry.id}`);
}
