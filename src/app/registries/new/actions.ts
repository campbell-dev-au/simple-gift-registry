"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, count } from "drizzle-orm";
import { getDb } from "@/db";
import { registries } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import {
  maxLengthError,
  TITLE_MAX_LENGTH,
  REGISTRY_COUNT_MAX,
} from "@/lib/field-limits";

// Signature shaped for useActionState (prevState before formData) so the
// form can show validation and cap errors inline; on success it redirects
// straight to the new registry.
export async function createRegistry(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const title = (formData.get("title") as string | null) ?? "";
  const eventDate = (formData.get("eventDate") as string | null) ?? "";
  if (!title.trim()) return { error: "Give the registry a title." };
  const lengthError = maxLengthError(title, TITLE_MAX_LENGTH, "Registry title");
  if (lengthError) return { error: lengthError };
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return { error: "That doesn't look like a valid event date." };
  }

  const db = getDb();
  const [{ owned }] = await db
    .select({ owned: count() })
    .from(registries)
    .where(eq(registries.ownerId, userId));
  if (owned >= REGISTRY_COUNT_MAX) {
    return {
      error: `You've reached the limit of ${REGISTRY_COUNT_MAX} registries. Archive or delete one to create another.`,
    };
  }

  const [registry] = await db
    .insert(registries)
    .values({
      ownerId: userId,
      title,
      eventDate: eventDate || null,
    })
    .returning();

  redirect(`/registries/${registry.id}`);
}
