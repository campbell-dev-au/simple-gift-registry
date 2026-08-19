"use client";

import Link from "next/link";
import { useOptimistic, useState, type ReactNode } from "react";
import { claimGift, unclaimGift } from "@/app/share/[token]/actions";
import { SubmitButton } from "@/components/submit-button";
import { Pill } from "@/components/pill";
import { ClaimProgress } from "@/components/claim-progress";
import { inputClass } from "@/components/field";

export type ShareGift = {
  id: string;
  name: string;
  notes: string | null;
  quantity: number;
  // Claims split viewer/others so an optimistic claim or unclaim only ever
  // rewrites the viewer's own share of the count.
  othersClaimed: number;
  myClaim: number;
};

type OptimisticShareGift = ShareGift & { pending?: boolean };

type ClaimEvent =
  | { type: "claim"; giftId: string; quantity: number }
  | { type: "unclaim"; giftId: string };

// The claimable gift list for guests. Claim state drives the progress bar,
// each gift's remaining count, and which section (Gifts vs Claimed) a card
// sits in — so all of it renders from one optimistic list: a claim or
// unclaim updates everything instantly while the server action and
// revalidation catch up. The revalidated data then replaces the optimistic
// state; on failure it rolls back and the card shows the returned error
// (e.g. losing a claim race).
export function ShareGifts({
  token,
  isSignedIn,
  signInUrl,
  signUpUrl,
  gifts,
  titleArea,
  saveArea,
}: {
  token: string;
  isSignedIn: boolean;
  signInUrl: string;
  signUpUrl: string;
  gifts: ShareGift[];
  titleArea: ReactNode;
  saveArea: ReactNode;
}) {
  const [optimisticGifts, applyClaimEvent] = useOptimistic(
    gifts as OptimisticShareGift[],
    (state, event: ClaimEvent) =>
      state.map((gift) => {
        if (gift.id !== event.giftId) return gift;
        return {
          ...gift,
          myClaim:
            event.type === "claim"
              ? Math.min(event.quantity, gift.quantity - gift.othersClaimed)
              : 0,
          pending: true,
        };
      }),
  );

  // Claim failures (usually a lost race) keyed by gift, held here rather
  // than in the card so the message survives the card moving between the
  // Gifts and Claimed sections when the real counts land.
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});

  function clearClaimError(giftId: string) {
    setClaimErrors((prev) => {
      if (!(giftId in prev)) return prev;
      const next = { ...prev };
      delete next[giftId];
      return next;
    });
  }

  async function handleClaim(giftId: string, formData: FormData) {
    const raw = Number.parseInt(formData.get("quantity") as string, 10);
    const quantity = Number.isInteger(raw) && raw > 0 ? raw : 1;
    clearClaimError(giftId);
    applyClaimEvent({ type: "claim", giftId, quantity });
    const result = await claimGift(token, giftId, null, formData);
    if (result?.error) {
      setClaimErrors((prev) => ({ ...prev, [giftId]: result.error }));
    }
  }

  async function handleUnclaim(giftId: string) {
    clearClaimError(giftId);
    applyClaimEvent({ type: "unclaim", giftId });
    await unclaimGift(token, giftId);
  }

  const remainingOf = (gift: OptimisticShareGift) =>
    gift.quantity - gift.othersClaimed - gift.myClaim;
  const availableGifts = optimisticGifts.filter((gift) => remainingOf(gift) > 0);
  const claimedGifts = optimisticGifts.filter((gift) => remainingOf(gift) <= 0);

  const totalQuantity = optimisticGifts.reduce((sum, g) => sum + g.quantity, 0);
  const totalClaimed = optimisticGifts.reduce(
    (sum, g) => sum + Math.min(g.othersClaimed + g.myClaim, g.quantity),
    0,
  );

  const renderCard = (gift: OptimisticShareGift) => (
    <ShareGiftCard
      key={gift.id}
      gift={gift}
      remaining={remainingOf(gift)}
      isSignedIn={isSignedIn}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      error={claimErrors[gift.id]}
      onClaim={handleClaim}
      onUnclaim={handleUnclaim}
    />
  );

  return (
    <>
      <div className="w-full max-w-md">
        {titleArea}
        {totalQuantity > 0 && (
          <div className="mt-4">
            <ClaimProgress claimed={totalClaimed} total={totalQuantity} />
          </div>
        )}
        {saveArea}
      </div>

      {optimisticGifts.length === 0 ? (
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
                {availableGifts.map(renderCard)}
              </ul>
            </section>
          )}

          {claimedGifts.length > 0 && (
            <section className="flex w-full max-w-md flex-col gap-3">
              <h2 className="font-display text-[17px] font-bold text-ink">
                Claimed
              </h2>
              <ul className="flex flex-col gap-2.5">
                {claimedGifts.map(renderCard)}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}

function ShareGiftCard({
  gift,
  remaining,
  isSignedIn,
  signInUrl,
  signUpUrl,
  error,
  onClaim,
  onUnclaim,
}: {
  gift: OptimisticShareGift;
  remaining: number;
  isSignedIn: boolean;
  signInUrl: string;
  signUpUrl: string;
  error?: string;
  onClaim: (giftId: string, formData: FormData) => Promise<void>;
  onUnclaim: (giftId: string) => Promise<void>;
}) {
  const claimedQuantity = gift.othersClaimed + gift.myClaim;

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

      {gift.myClaim > 0 && (
        <div
          className={`mt-3 flex items-center gap-3 ${
            gift.pending ? "opacity-60" : ""
          }`}
        >
          <span className="text-sm text-ink-dim">
            Claimed by you ({gift.myClaim})
          </span>
          <form action={() => onUnclaim(gift.id)}>
            {/* Disabled while the claim itself is still saving — there's
                no server row to delete until it lands. */}
            <SubmitButton
              variant="ghost"
              size="sm"
              disabled={gift.pending}
              aria-label={`Unclaim ${gift.name}`}
            >
              Unclaim
            </SubmitButton>
          </form>
        </div>
      )}

      {gift.myClaim === 0 && remaining > 0 && isSignedIn && (
        <form
          action={(formData) => onClaim(gift.id, formData)}
          className="mt-3 flex items-center gap-2"
        >
          <label htmlFor={`quantity-${gift.id}`} className="sr-only">
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
          <SubmitButton
            variant="claim"
            size="sm"
            aria-label={`Claim ${gift.name}`}
          >
            Claim
          </SubmitButton>
        </form>
      )}

      {remaining > 0 && !isSignedIn && (
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

      {error && (
        <p className="mt-2 text-sm text-amber" role="status">
          {error}
        </p>
      )}
    </li>
  );
}
