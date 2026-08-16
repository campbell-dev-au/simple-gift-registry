# User Story: Add a gift to a registry

**As a** registry owner
**I want** to add a gift to my registry
**So that** people know what I'd like to receive

## Acceptance Criteria

- From my registry page, I can add a gift with a name, optional notes (no link field), and a quantity.
- Quantity defaults to 1 if not specified.
- The gift appears in the registry's gift list, showing its quantity.
- Only the registry's owner can add gifts to it.

## Notes

- Gifts belong to a registry via `registryId` (FK, cascades on delete — see `src/db/schema.ts`).
- Ownership is enforced in the Server Action (`src/app/registries/[id]/actions.ts`), not just hidden in the UI: the add-gift form only renders for the owner, and `addGift` independently re-checks `registry.ownerId === userId` before inserting.
- The functional test arranges its registry precondition directly via Drizzle (`features/step-definitions/registry-test-data.ts`) rather than through the create-registry UI — same "arrange via code, exercise via UI" principle as the account tests.
- Registry viewing still isn't restricted to the owner (see [`create-registry.md`](create-registry.md)) — this story only locks down *adding* gifts.

## Related Gherkin

[`features/registry/add_gift.feature`](../../features/registry/add_gift.feature)
