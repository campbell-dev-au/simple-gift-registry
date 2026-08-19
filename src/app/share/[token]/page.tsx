import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registrySaves } from "@/db/schema";
import { saveRegistry, unsaveRegistry } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { ShareGifts } from "@/components/share-gifts";
import { SharePasswordGate } from "@/components/share-password-gate";
import { formatEventDate } from "@/lib/format-date";
import { canManageRegistry } from "@/lib/registry-access";
import { hasShareAccess } from "@/lib/share-password";
import { isUuid } from "@/lib/validation";

// Share links get posted in group chats and social feeds; a registry (gift
// list, owner's notes) should never end up in a search index because of
// that. next.config.ts additionally sends X-Robots-Tag for /share/.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isUuid(token)) notFound();

  const { userId } = await auth();

  const db = getDb();
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.shareToken, token));

  if (!registry) notFound();

  const isOwner = userId === registry.ownerId;

  // Password gate. Owners and co-owners skip it — they already proved a
  // stronger identity than the password — and the server actions behind
  // this page re-check the same unlock cookie (see requireShareUnlock in
  // ./actions.ts), so the gate is presentation, not the enforcement.
  if (registry.sharePasswordHash) {
    const cookieStore = await cookies();
    const unlocked =
      hasShareAccess(registry, cookieStore) ||
      isOwner ||
      (await canManageRegistry(db, registry.ownerId, registry.id, userId ?? null));
    if (!unlocked) {
      return <SharePasswordGate token={token} title={registry.title} />;
    }
  }

  if (registry.archivedAt) {
    return (
      <main className="flex flex-1 flex-col items-center gap-8 p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-[26px] font-bold text-ink">
            {registry.title}
          </h1>
          <p className="mt-4 text-sm text-ink-dim">
            This registry has been archived and is no longer accepting
            claims.
          </p>
        </div>
      </main>
    );
  }

  // One parallel wave: claims don't need the gift list first — a subquery
  // scopes them to this registry's gifts in the same round trip.
  const [registryGifts, claims, saves] = await Promise.all([
    db.select().from(gifts).where(eq(gifts.registryId, registry.id)),
    db
      .select()
      .from(giftClaims)
      .where(
        inArray(
          giftClaims.giftId,
          db
            .select({ id: gifts.id })
            .from(gifts)
            .where(eq(gifts.registryId, registry.id)),
        ),
      ),
    userId && !isOwner
      ? db
          .select({ id: registrySaves.id })
          .from(registrySaves)
          .where(
            and(
              eq(registrySaves.registryId, registry.id),
              eq(registrySaves.savedByUserId, userId),
            ),
          )
      : [],
  ]);

  const isSaved = saves.length > 0;

  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(`/share/${token}`)}`;

  // Viewer's claim split from everyone else's, so the client can update
  // only its own share of the count optimistically (see ShareGifts).
  const shareGifts = registryGifts.map((gift) => {
    const giftClaimsList = claims.filter((claim) => claim.giftId === gift.id);
    const myClaim = giftClaimsList
      .filter((claim) => claim.claimedByUserId === userId)
      .reduce((sum, claim) => sum + claim.quantity, 0);
    const othersClaimed =
      giftClaimsList.reduce((sum, claim) => sum + claim.quantity, 0) - myClaim;
    return {
      id: gift.id,
      name: gift.name,
      notes: gift.notes,
      quantity: gift.quantity,
      othersClaimed,
      myClaim,
    };
  });

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      <ShareGifts
        token={token}
        isSignedIn={!!userId}
        signInUrl={signInUrl}
        signUpUrl={signUpUrl}
        gifts={shareGifts}
        titleArea={
          <>
            <h1 className="font-display text-[26px] font-bold text-ink">
              {registry.title}
            </h1>
            {registry.eventDate && (
              <p className="mt-1.5 text-sm text-ink-dim">
                {formatEventDate(registry.eventDate)}
              </p>
            )}
            {registry.notes && (
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-ink-dim">
                {registry.notes}
              </p>
            )}
          </>
        }
        saveArea={
          <>
            {userId && !isOwner && (
              <div className="mt-4">
                {isSaved ? (
                  <form action={unsaveRegistry.bind(null, token)}>
                    <SubmitButton variant="text">
                      Remove from my registries
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={saveRegistry.bind(null, token)}>
                    <SubmitButton variant="text">
                      Save to my registries
                    </SubmitButton>
                  </form>
                )}
              </div>
            )}

            {!userId && (
              <p className="mt-4 text-sm text-ink-dim">
                <Link href={signInUrl} className="text-violet hover:underline">
                  Sign in to save this registry
                </Link>{" "}
                to your account.
              </p>
            )}
          </>
        }
      />
    </main>
  );
}
