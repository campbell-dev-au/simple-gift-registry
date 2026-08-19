"use client";

import { useOptimistic } from "react";
import { AddGiftForm } from "@/components/add-gift-form";
import { GiftCard } from "@/components/gift-card";
import { IconGift } from "@/components/icons";
import { sectionTitleClass } from "@/components/field";

export type GiftListItem = {
  id: string;
  name: string;
  notes: string | null;
  quantity: number;
  claimed: number;
};

type OptimisticGift = GiftListItem & { pending?: boolean };

// The add-gift form and the gift list share optimistic state: a submitted
// gift appears in the list immediately (dimmed, uneditable) while the
// server action and revalidation run, instead of the whole page sitting
// still for the round trip. When the revalidated list arrives it replaces
// the optimistic entry; if the action fails, the entry disappears with the
// rolled-back state and the error boundary reports it.
export function GiftList({
  registryId,
  canManage,
  showClaims,
  gifts,
}: {
  registryId: string;
  canManage: boolean;
  showClaims: boolean;
  gifts: GiftListItem[];
}) {
  const [optimisticGifts, addOptimisticGift] = useOptimistic(
    gifts as OptimisticGift[],
    (state, newGift: OptimisticGift) => [...state, newGift],
  );

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <AddGiftForm
          registryId={registryId}
          onOptimisticAdd={(gift) =>
            addOptimisticGift({
              ...gift,
              id: crypto.randomUUID(),
              claimed: 0,
              pending: true,
            })
          }
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className={`${sectionTitleClass} flex items-center gap-2`}>
          <IconGift className="text-violet" />
          Gifts
        </h2>
        {optimisticGifts.length === 0 ? (
          <p className="text-sm text-ink-dim">No gifts yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {optimisticGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                registryId={registryId}
                canManage={canManage}
                showClaims={showClaims}
                claimed={gift.claimed}
                pending={gift.pending}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
