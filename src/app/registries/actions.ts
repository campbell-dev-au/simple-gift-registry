"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { registryInvitations, registrySaves } from "@/db/schema";

// currentUser() intermittently throws a resource_not_found error for the
// requesting user's own (just-created, real, signed-in) account — observed
// against Clerk's dev instance, evidently a brief eventual-consistency gap
// on their end rather than anything wrong with the session. Since a valid
// session's own user record can't legitimately be missing, a couple of
// short retries clears it without masking a real error (a persistent
// failure still throws after the last attempt).
async function currentUserWithRetry(attempts = 3, delayMs = 300) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await currentUser();
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

// Only verified addresses count — an unverified email is one the account
// holder hasn't actually proven they control, so it shouldn't be able to
// pull in someone else's pending invitation.
async function requireInvitedEmailMatch(invitationEmail: string) {
  const user = await currentUserWithRetry();
  const verifiedEmails = (user?.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());

  if (!verifiedEmails.includes(invitationEmail.toLowerCase())) {
    throw new Error("This invitation isn't for your account.");
  }
}

export async function acceptInvitation(invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  const [invitation] = await db
    .select()
    .from(registryInvitations)
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.status, "pending"),
      ),
    );

  if (!invitation) return;
  await requireInvitedEmailMatch(invitation.email);

  await db
    .update(registryInvitations)
    .set({
      status: "accepted",
      acceptedByUserId: userId,
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.status, "pending"),
      ),
    );

  revalidatePath("/registries");
}

// Scoped by savedByUserId, mirroring unclaimGift/removeCoOwner — the WHERE
// clause is the authorization check, not just a hidden button, so this can
// take a bare registryId without re-deriving the share token.
export async function removeSavedRegistry(registryId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  await db
    .delete(registrySaves)
    .where(
      and(
        eq(registrySaves.registryId, registryId),
        eq(registrySaves.savedByUserId, userId),
      ),
    );

  revalidatePath("/registries");
}

export async function declineInvitation(invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  const [invitation] = await db
    .select()
    .from(registryInvitations)
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.status, "pending"),
      ),
    );

  if (!invitation) return;
  await requireInvitedEmailMatch(invitation.email);

  await db
    .update(registryInvitations)
    .set({ status: "declined", respondedAt: new Date() })
    .where(
      and(
        eq(registryInvitations.id, invitationId),
        eq(registryInvitations.status, "pending"),
      ),
    );

  revalidatePath("/registries");
}
