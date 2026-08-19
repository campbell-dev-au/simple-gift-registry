"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  registries,
  giftClaims,
  registryInvitations,
  registrySaves,
} from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { currentUserWithRetry, verifiedEmailsOf } from "@/lib/clerk-user";

type Db = ReturnType<typeof getDb>;

// Removes every row this user is responsible for:
// - registries they own (gifts, claims, invitations, and saves on them go
//   via ON DELETE CASCADE),
// - their claims and saves on other people's registries,
// - their co-ownerships (accepted invitation rows) on other registries,
// - pending invitations addressed to any of their verified emails.
// Invitations they *sent* on registries they don't own are kept — those
// rows belong to the registry, and the invited person's standing on it
// shouldn't vanish because the inviter left.
async function wipeAccountData(db: Db, userId: string) {
  const verifiedEmails = verifiedEmailsOf(await currentUserWithRetry());

  await db.delete(registries).where(eq(registries.ownerId, userId));
  await db.delete(giftClaims).where(eq(giftClaims.claimedByUserId, userId));
  await db.delete(registrySaves).where(eq(registrySaves.savedByUserId, userId));
  await db
    .delete(registryInvitations)
    .where(eq(registryInvitations.acceptedByUserId, userId));
  if (verifiedEmails.length > 0) {
    await db
      .delete(registryInvitations)
      .where(
        and(
          eq(registryInvitations.status, "pending"),
          inArray(registryInvitations.email, verifiedEmails),
        ),
      );
  }
}

// "Start over": wipes everything the account has created or touched but
// keeps the account itself. Called through useActionState (which passes
// prevState and formData); neither is needed here.
export async function deleteAllAccountData(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await wipeAccountData(getDb(), userId);

  revalidatePath("/registries");
  return { ok: true };
}

// Full deletion: the data wipe above, then the Clerk account itself. The
// wipe runs first so a failure deleting the Clerk user can't leave data
// behind with no account able to reach it.
//
// Returns instead of redirecting: deleting the Clerk user revokes the
// session server-side, but the browser's short-lived session JWT stays
// verifiable until it expires (~a minute), so a redirect here would land
// on a homepage that still renders signed-in. The client reacts to the
// ok by running Clerk's signOut, which clears the local session at the
// same moment (see AccountDangerZone).
export async function deleteAccount(): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await wipeAccountData(getDb(), userId);

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return { ok: true };
}
