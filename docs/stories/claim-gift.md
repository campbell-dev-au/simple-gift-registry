# User Story: Claim a gift from a shared registry

**As a** guest with a registry's share link
**I want** to claim a gift using my own account
**So that** other guests know it's covered, without anyone seeing who claimed what

## Acceptance Criteria

- From the share link, a signed-in guest can claim any quantity of a gift up to what's currently remaining — one form, no separate page.
- A signed-out visitor sees a prompt to sign in or create an account (carrying them back to this same share link afterward) instead of a claim form.
- Everyone viewing the share link sees how many of a gift remain unclaimed, even when several different guests have each claimed part of it — without seeing who claimed which portion.
- A fully-claimed gift shows "Claimed" to everyone except contributing claimants, who each see "Claimed by you (N)" for their own portion and an Unclaim control for it.
- Only the person who made a claim can unclaim it — enforced server-side, not just by hiding the button.
- A guest can't claim more than what's currently remaining, even under concurrent claims from other guests.
- The registry owner does **not** see claim status on their own (authenticated) registry page — only via the public share link, same as anyone else (deliberate product choice, asked and confirmed when this story was first built).

## Notes

- **Revised from the first pass.** The original version let anyone claim by typing a free-text name, with no way to stop one guest from unclaiming another's gift or seeing who claimed what. Both were flagged as real privacy problems after shipping. A cookie-based "claim key" (no account, just a private per-browser secret) was considered and rejected in favor of real accounts — more robust across devices, at the cost of the signup friction the anonymous version was built to avoid. That tradeoff was made deliberately, not defaulted into.
- **Claiming requires sign-in; viewing does not.** `/share/[token]` itself stays fully public — proxy.ts is untouched. Only `claimGift`/`unclaimGift` (`src/app/share/[token]/actions.ts`) check `auth()`, redirecting to `/sign-in?redirect_url=/share/[token]` if signed out. The share page conditionally renders a claim form, an "Unclaim" control, or a sign-in prompt per gift, based on `auth()` and whether the viewer has a `gift_claims` row for that gift.
- **Partial-quantity claiming, revised from whole-gift-only.** A gift's claims now live in a separate `gift_claims` table (`giftId`, `claimedByUserId`, `quantity`), one row per guest's claim on a gift, instead of a single `claimedByUserId`/`claimedAt` pair on `gifts`. Remaining quantity is `gifts.quantity - sum(gift_claims.quantity)`. A guest holds at most one claim row per gift — to change the amount they've claimed, they unclaim (deleting their row) and claim again, rather than the UI supporting an in-place edit.
- **Authorization is enforced in the database query, not just the UI.** `unclaimGift`'s `WHERE` clause includes `claimedByUserId = <current user>` — someone else's claim simply doesn't match and the delete affects 0 rows, regardless of what the client sends.
- **Claiming is race-safe via row locking, not just a `WHERE` guard.** Partial quantities mean two concurrent claims on the same gift can each be individually valid yet oversell together (e.g. two guests each claiming the "last" 2 of a gift with 2 remaining), which a simple `WHERE remaining IS NULL`-style guard can't catch. `claimGift` runs in a transaction that takes a `SELECT ... FOR UPDATE` lock on the gift row before reading how much is already claimed, so concurrent claimants on the same gift serialize instead of racing; a claim that no longer fits by the time it's this transaction's turn is silently skipped.
- Sign-in/sign-up needed a `redirect_url` query param added to support "come back to the share link after auth" (`src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`). Validated to same-origin relative paths only (`/...`, rejecting `//host` too) to avoid turning it into an open redirect.
- The owner *can* still see claims by visiting their own share link — an inherent honor-system limit of any link-based sharing model, not something worth building extra machinery to prevent.

## Related Gherkin

[`features/registry/claim_gift.feature`](../../features/registry/claim_gift.feature)
