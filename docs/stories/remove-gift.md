# User Story: Remove a gift from a registry

**As a** registry owner
**I want** to remove a gift from my registry
**So that** I can keep my list accurate

## Acceptance Criteria

- From my registry page, each gift has a "Remove" control.
- Removing a gift deletes it and it no longer appears in the registry's gift list.
- Only the registry's owner can remove its gifts; non-owners viewing the registry don't see a remove control.

## Notes

- Removal is a same-page action (`deleteGift` in `src/app/registries/[id]/actions.ts`), not a separate confirmation page — consistent with this being a bare-bones pass. Adding a confirmation step is a reasonable follow-up if accidental removal turns out to be a problem in practice.
- Ownership enforcement matches [`edit-gift.md`](edit-gift.md): shared `requireOwnedRegistry` helper, and the delete's `WHERE` clause is scoped to the gift's `registryId`.

## Related Gherkin

[`features/registry/remove_gift.feature`](../../features/registry/remove_gift.feature)
