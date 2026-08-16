# User Story: Claim a gift from a shared registry

**As a** guest with a registry's share link
**I want** to claim a gift without creating an account
**So that** other guests know it's already covered

## Acceptance Criteria

- From the share link, anyone can claim an unclaimed gift by giving their name — no account required.
- A claimed gift shows who claimed it and can be unclaimed (by anyone with the link — see Notes).
- The registry owner does **not** see claim status on their own (authenticated) registry page — only via the public share link, same as anyone else. This was a deliberate product choice (asked and confirmed), not a default.

## Notes

- **Anonymous and trust-based, by design.** There's no guest account, so nothing verifies that the person unclaiming a gift is the one who claimed it. This is inherent to "no account required" rather than an oversight — it mirrors how a physical registry works (anyone can see and cross off a paper list). Optional guest accounts (mentioned as a possible future nice-to-have) would let claims be tied to a verified identity, but that's out of scope for this pass.
- **Whole-gift claiming, not partial quantity.** A gift with `quantity: 3` is claimed as one unit, not tracked as "2 of 3 claimed." No requirement was stated for partial-quantity tracking, and it would add real complexity (concurrent partial claims, a second UI) for a case that can be coordinated between guests off-app.
- Claim data (`claimedByName`, `claimedAt` in `src/db/schema.ts`) is real columns returned by the owner's registry-page query, but the owner's page (`src/app/registries/[id]/page.tsx`) never renders them — since that page is a Server Component, the data itself never reaches the owner's browser, not just hidden by CSS.
- The owner *can* still see claims by visiting their own share link — that's an inherent honor-system limit of any link-based sharing model, not something worth building extra machinery to prevent.

## Related Gherkin

[`features/registry/claim_gift.feature`](../../features/registry/claim_gift.feature)
