"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { registryInvitations, registrySaves } from "@/db/schema";
import { isUuid } from "@/lib/validation";
import { currentUserWithRetry, verifiedEmailsOf } from "@/lib/clerk-user";

// Only verified addresses count — an unverified email is one the account
// holder hasn't actually proven they control, so it shouldn't be able to
// pull in someone else's pending invitation.
async function requireInvitedEmailMatch(invitationEmail: string) {
  const verifiedEmails = verifiedEmailsOf(await currentUserWithRetry());

  if (!verifiedEmails.includes(invitationEmail.toLowerCase())) {
    throw new Error("This invitation isn't for your account.");
  }
}

export async function acceptInvitation(invitationId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isUuid(invitationId)) return;

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
  if (!isUuid(registryId)) return;

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
  if (!isUuid(invitationId)) return;

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
