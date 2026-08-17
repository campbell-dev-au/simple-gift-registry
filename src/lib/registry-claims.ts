import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { gifts, giftClaims } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export type ClaimSummary = { total: number; claimed: number };

// Aggregate claimed-vs-total gift quantity per registry, without exposing
// who claimed what — used for the owner-facing progress indicator, which
// must stay claimer-anonymous the same way the guest-facing remaining
// count already is (see gift_claims in src/db/schema.ts).
export async function getClaimSummaries(
  db: Db,
  registryIds: string[],
): Promise<Map<string, ClaimSummary>> {
  const summaries = new Map<string, ClaimSummary>();
  if (registryIds.length === 0) return summaries;

  const allGifts = await db
    .select({
      id: gifts.id,
      registryId: gifts.registryId,
      quantity: gifts.quantity,
    })
    .from(gifts)
    .where(inArray(gifts.registryId, registryIds));

  const giftIds = allGifts.map((g) => g.id);
  const claims =
    giftIds.length === 0
      ? []
      : await db
          .select({
            giftId: giftClaims.giftId,
            quantity: giftClaims.quantity,
          })
          .from(giftClaims)
          .where(inArray(giftClaims.giftId, giftIds));

  const claimedByGift = new Map<string, number>();
  for (const claim of claims) {
    claimedByGift.set(
      claim.giftId,
      (claimedByGift.get(claim.giftId) ?? 0) + claim.quantity,
    );
  }

  for (const gift of allGifts) {
    const summary = summaries.get(gift.registryId) ?? {
      total: 0,
      claimed: 0,
    };
    summary.total += gift.quantity;
    summary.claimed += Math.min(
      claimedByGift.get(gift.id) ?? 0,
      gift.quantity,
    );
    summaries.set(gift.registryId, summary);
  }

  return summaries;
}
