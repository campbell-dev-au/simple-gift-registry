import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { gifts, giftClaims } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export type ClaimSummary = { total: number; claimed: number };

// Aggregate claimed-vs-total gift quantity per registry, without exposing
// who claimed what — used for the owner-facing progress indicator, which
// must stay claimer-anonymous the same way the guest-facing remaining
// count already is (see gift_claims in src/db/schema.ts).
//
// One round trip: claims are summed per gift in a subquery, capped at each
// gift's quantity (over-claims can't inflate the bar past 100%), then
// rolled up per registry.
export async function getClaimSummaries(
  db: Db,
  registryIds: string[],
): Promise<Map<string, ClaimSummary>> {
  const summaries = new Map<string, ClaimSummary>();
  if (registryIds.length === 0) return summaries;

  const claimTotals = db
    .select({
      giftId: giftClaims.giftId,
      claimed: sql<number>`sum(${giftClaims.quantity})`.as("claimed"),
    })
    .from(giftClaims)
    .groupBy(giftClaims.giftId)
    .as("claim_totals");

  const rows = await db
    .select({
      registryId: gifts.registryId,
      total: sql<number>`sum(${gifts.quantity})::int`,
      claimed: sql<number>`sum(least(coalesce(${claimTotals.claimed}, 0), ${gifts.quantity}))::int`,
    })
    .from(gifts)
    .leftJoin(claimTotals, eq(claimTotals.giftId, gifts.id))
    .where(inArray(gifts.registryId, registryIds))
    .groupBy(gifts.registryId);

  for (const row of rows) {
    summaries.set(row.registryId, {
      total: row.total,
      claimed: row.claimed,
    });
  }

  return summaries;
}
