# User Story: Edit a gift on a registry

**As a** registry owner
**I want** to edit a gift on my registry
**So that** I can correct its name, notes, or quantity

## Acceptance Criteria

- From my registry page, each gift has an "Edit" control that opens a form pre-filled with its current name, notes, and quantity.
- Saving updates the gift and returns me to the registry page, showing the new details.
- Only the registry's owner can edit its gifts; non-owners viewing the registry don't see edit controls.

## Notes

- Route: `/registries/[id]/gifts/[giftId]/edit`. Ownership is enforced the same way as [`edit-registry.md`](edit-registry.md) — via the shared `requireOwnedRegistry` helper — and `updateGift` additionally scopes its `WHERE` clause to the gift's `registryId`, not just its own id.
- The functional test seeds its gift directly via Drizzle (`features/step-definitions/registry-test-data.ts`), same "arrange via code" principle as the registry precondition.

## Related Gherkin

[`features/registry/edit_gift.feature`](../../features/registry/edit_gift.feature)
