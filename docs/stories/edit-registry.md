# User Story: Edit a gift registry

**As a** registry owner
**I want** to edit my registry's title and event date
**So that** I can correct or update its details after creating it

## Acceptance Criteria

- From my registry page, I can navigate to an edit form pre-filled with the current title and event date.
- Saving updates the registry and returns me to the registry page, showing the new details.
- Only the registry's owner can edit it.

## Notes

- Route: `/registries/[id]/edit`. Ownership is enforced both by hiding the "Edit registry" link for non-owners and by `updateRegistry` re-checking `registry.ownerId === userId` (via the shared `requireOwnedRegistry` helper in `src/app/registries/[id]/actions.ts`) before writing.
- A non-owner who navigates to the edit URL directly is redirected back to the registry page rather than shown a form or an error.

## Related Gherkin

[`features/registry/edit_registry.feature`](../../features/registry/edit_registry.feature)
