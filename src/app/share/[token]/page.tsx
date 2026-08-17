import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registrySaves } from "@/db/schema";
import { claimGift, unclaimGift, saveRegistry, unsaveRegistry } from "./actions";
import { Button, buttonClasses } from "@/components/button";
import { Pill } from "@/components/pill";
import { ClaimProgress } from "@/components/claim-progress";
import { inputClass } from "@/components/field";

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

  const registryGifts = await db
    .select()
    .from(gifts)
    .where(eq(gifts.registryId, registry.id));

  const claims =
    registryGifts.length === 0
      ? []
      : await db
          .select()
          .from(giftClaims)
          .where(
            inArray(
              giftClaims.giftId,
              registryGifts.map((gift) => gift.id),
            ),
          );

  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(`/share/${token}`)}`;

  const isOwner = userId === registry.ownerId;
  let isSaved = false;
  if (userId && !isOwner) {
    const [save] = await db
      .select({ id: registrySaves.id })
      .from(registrySaves)
      .where(
        and(
          eq(registrySaves.registryId, registry.id),
          eq(registrySaves.savedByUserId, userId),
        ),
      );
    isSaved = !!save;
  }

  const totalQuantity = registryGifts.reduce((sum, g) => sum + g.quantity, 0);
  const totalClaimed = registryGifts.reduce((sum, gift) => {
    const claimed = claims
      .filter((c) => c.giftId === gift.id)
      .reduce((s, c) => s + c.quantity, 0);
    return sum + Math.min(claimed, gift.quantity);
  }, 0);

  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold tracking-wide text-ink-dim uppercase">
          You&rsquo;re invited
        </p>
        <h1 className="font-display mt-1 text-[26px] font-bold text-ink">
          {registry.title}
        </h1>
        {registry.eventDate && (
          <p className="mt-1.5 text-sm text-ink-dim">{registry.eventDate}</p>
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
                <button type="submit" className={buttonClasses("text")}>
                  Remove from my registries
                </button>
              </form>
            ) : (
              <form action={saveRegistry.bind(null, token)}>
                <button type="submit" className={buttonClasses("text")}>
                  Save to my registries
                </button>
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

      <section className="flex w-full max-w-md flex-col gap-3">
        <h2 className="font-display text-[17px] font-bold text-ink">
          Gifts
        </h2>
        {registryGifts.length === 0 ? (
          <p className="text-sm text-ink-dim">No gifts yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {registryGifts.map((gift) => {
              const giftClaimsList = claims.filter(
                (claim) => claim.giftId === gift.id,
              );
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
                claimedQuantity === 0
                  ? "available"
                  : remaining > 0
                    ? "partial"
                    : "claimed";
              const label = remaining > 0 ? `${remaining} remaining` : "Claimed";

              return (
                <li
                  key={gift.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{gift.name}</p>
                      <p className="mt-0.5 text-xs text-ink-dim">
                        Quantity: {gift.quantity}
                      </p>
                      {gift.notes && (
                        <p className="mt-1 text-xs text-ink-dim">
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
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          aria-label={`Unclaim ${gift.name}`}
                        >
                          Unclaim
                        </Button>
                      </form>
                    </div>
                  )}

                  {!myClaim && remaining > 0 && userId && (
                    <form
                      action={claimGift.bind(null, token, gift.id)}
                      className="mt-3 flex items-center gap-2"
                    >
                      <label
                        htmlFor={`quantity-${gift.id}`}
                        className="sr-only"
                      >
                        Quantity to claim
                      </label>
                      <input
                        id={`quantity-${gift.id}`}
                        name="quantity"
                        type="number"
                        min={1}
                        max={remaining}
                        defaultValue={1}
                        className={`${inputClass} !w-16 py-1.5 text-center font-mono text-sm`}
                      />
                      <Button
                        type="submit"
                        variant="claim"
                        size="sm"
                        aria-label={`Claim ${gift.name}`}
                      >
                        Claim
                      </Button>
                    </form>
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
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
