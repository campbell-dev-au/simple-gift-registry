import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registrySaves } from "@/db/schema";
import { unclaimGift, saveRegistry, unsaveRegistry } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { ClaimForm } from "@/components/claim-form";
import { Pill } from "@/components/pill";
import { ClaimProgress } from "@/components/claim-progress";
import { formatEventDate } from "@/lib/format-date";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  if (!isUuid) notFound();

  const { userId } = await auth();

  const db = getDb();
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.shareToken, token));

  if (!registry) notFound();

  const isOwner = userId === registry.ownerId;

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

  const totalQuantity = registryGifts.reduce((sum, g) => sum + g.quantity, 0);
  const totalClaimed = registryGifts.reduce((sum, gift) => {
    const claimed = claims
      .filter((c) => c.giftId === gift.id)
      .reduce((s, c) => s + c.quantity, 0);
    return sum + Math.min(claimed, gift.quantity);
  }, 0);

  const isFullyClaimed = (gift: (typeof registryGifts)[number]) => {
    const claimedQuantity = claims
      .filter((c) => c.giftId === gift.id)
      .reduce((s, c) => s + c.quantity, 0);
    return claimedQuantity >= gift.quantity;
  };
  const availableGifts = registryGifts.filter((gift) => !isFullyClaimed(gift));
  const claimedGifts = registryGifts.filter((gift) => isFullyClaimed(gift));

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      <div className="w-full max-w-md">
        <h1 className="font-display text-[26px] font-bold text-ink">
          {registry.title}
        </h1>
        {registry.eventDate && (
          <p className="mt-1.5 text-sm text-ink-dim">
            {formatEventDate(registry.eventDate)}
          </p>
        )}

        {totalQuantity > 0 && (
          <div className="mt-4">
            <ClaimProgress claimed={totalClaimed} total={totalQuantity} />
          </div>
        )}

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
      </div>

      {registryGifts.length === 0 ? (
        <section className="flex w-full max-w-md flex-col gap-3">
          <h2 className="font-display text-[17px] font-bold text-ink">
            Gifts
          </h2>
          <p className="text-sm text-ink-dim">No gifts yet.</p>
        </section>
      ) : (
        <>
          {availableGifts.length > 0 && (
            <section className="flex w-full max-w-md flex-col gap-3">
              <h2 className="font-display text-[17px] font-bold text-ink">
                Gifts
              </h2>
              <ul className="flex flex-col gap-2.5">
                {availableGifts.map((gift) => (
                  <GiftListItem
                    key={gift.id}
                    gift={gift}
                    claims={claims}
                    userId={userId}
                    token={token}
                    signInUrl={signInUrl}
                    signUpUrl={signUpUrl}
                  />
                ))}
              </ul>
            </section>
          )}

          {claimedGifts.length > 0 && (
            <section className="flex w-full max-w-md flex-col gap-3">
              <h2 className="font-display text-[17px] font-bold text-ink">
                Claimed
              </h2>
              <ul className="flex flex-col gap-2.5">
                {claimedGifts.map((gift) => (
                  <GiftListItem
                    key={gift.id}
                    gift={gift}
                    claims={claims}
                    userId={userId}
                    token={token}
                    signInUrl={signInUrl}
                    signUpUrl={signUpUrl}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function GiftListItem({
  gift,
  claims,
  userId,
  token,
  signInUrl,
  signUpUrl,
}: {
  gift: typeof gifts.$inferSelect;
  claims: (typeof giftClaims.$inferSelect)[];
  userId: string | null | undefined;
  token: string;
  signInUrl: string;
  signUpUrl: string;
}) {
  const giftClaimsList = claims.filter((claim) => claim.giftId === gift.id);
  const claimedQuantity = giftClaimsList.reduce(
    (sum, claim) => sum + claim.quantity,
    0,
  );
  const remaining = gift.quantity - claimedQuantity;
  const myClaim = giftClaimsList.find(
    (claim) => claim.claimedByUserId === userId,
  );

  // Everyone sees the same general status regardless of who
  // claimed what — myClaim below adds an extra, viewer-only
  // "claimed by you" note, it never replaces this. Keeping the
  // two separate is what stops a guest's own claim from also
  // revealing (to them) whether the *general* status differs
  // from what they personally claimed.
  const tone =
    claimedQuantity === 0 ? "available" : remaining > 0 ? "partial" : "claimed";
  const label = remaining > 0 ? `${remaining} remaining` : "Claimed";

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-ink">{gift.name}</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            Quantity: {gift.quantity}
          </p>
          {gift.notes && (
            <p className="mt-1 break-words text-xs text-ink-dim">
              {gift.notes}
            </p>
          )}
        </div>
        <Pill tone={tone}>{label}</Pill>
      </div>

      {myClaim && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-ink-dim">
            Claimed by you ({myClaim.quantity})
          </span>
          <form action={unclaimGift.bind(null, token, gift.id)}>
            <SubmitButton
              variant="ghost"
              size="sm"
              aria-label={`Unclaim ${gift.name}`}
            >
              Unclaim
            </SubmitButton>
          </form>
        </div>
      )}

      {!myClaim && remaining > 0 && userId && (
        <ClaimForm
          token={token}
          giftId={gift.id}
          giftName={gift.name}
          remaining={remaining}
        />
      )}

      {remaining > 0 && !userId && (
        <p className="mt-3 text-sm text-ink-dim">
          <Link href={signInUrl} className="text-violet hover:underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href={signUpUrl} className="text-violet hover:underline">
            create an account
          </Link>{" "}
          to claim this gift.
        </p>
      )}
    </li>
  );
}
