# User Story: Claim a gift from a shared registry

**As a** guest with a registry's share link
**I want** to claim a gift using my own account
**So that** other guests know it's covered, without anyone seeing who claimed what

## Acceptance Criteria

- From the share link, a signed-in guest can claim an unclaimed gift with one click — no separate form.
- A signed-out visitor sees a prompt to sign in or create an account (carrying them back to this same share link afterward) instead of a claim button.
- A claimed gift shows "Claimed" to everyone except the claimant, who sees "Claimed by you" and an Unclaim control.
- Only the person who claimed a gift can unclaim it — enforced server-side, not just by hiding the button.
- The registry owner does **not** see claim status on their own (authenticated) registry page — only via the public share link, same as anyone else (deliberate product choice, asked and confirmed when this story was first built).

## Notes

- **Revised from the first pass.** The original version let anyone claim by typing a free-text name, with no way to stop one guest from unclaiming another's gift or seeing who claimed what. Both were flagged as real privacy problems after shipping. A cookie-based "claim key" (no account, just a private per-browser secret) was considered and rejected in favor of real accounts — more robust across devices, at the cost of the signup friction the anonymous version was built to avoid. That tradeoff was made deliberately, not defaulted into.
- **Claiming requires sign-in; viewing does not.** `/share/[token]` itself stays fully public — proxy.ts is untouched. Only `claimGift`/`unclaimGift` (`src/app/share/[token]/actions.ts`) check `auth()`, redirecting to `/sign-in?redirect_url=/share/[token]` if signed out. The share page conditionally renders a claim button, an "Unclaim" control, or a sign-in prompt per gift, based on `auth()` and whether `claimedByUserId` matches the viewer.
- **Authorization is enforced in the database query, not just the UI.** `unclaimGift`'s `WHERE` clause includes `claimedByUserId = <current user>` — someone else's claim simply doesn't match and the update is a no-op, regardless of what the client sends.
- **Claiming is race-safe.** `claimGift`'s `WHERE` clause requires `claimedAt IS NULL`, so if two guests submit a claim for the same gift nearly simultaneously, the second one just fails silently instead of stealing the first guest's claim.
- Sign-in/sign-up needed a `redirect_url` query param added to support "come back to the share link after auth" (`src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`). Validated to same-origin relative paths only (`/...`, rejecting `//host` too) to avoid turning it into an open redirect.
- **Whole-gift claiming, not partial quantity** — unchanged from the original design. A gift with `quantity: 3` is claimed as one unit; no requirement was stated for partial-quantity tracking.
- The owner *can* still see claims by visiting their own share link — an inherent honor-system limit of any link-based sharing model, not something worth building extra machinery to prevent.

## Related Gherkin

[`features/registry/claim_gift.feature`](../../features/registry/claim_gift.feature)
