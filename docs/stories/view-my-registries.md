# User Story: View my registries

**As a** signed-in user
**I want** to see a list of my gift registries
**So that** I can select the one I want to view or add gifts to

## Acceptance Criteria

- From the homepage, a signed-in user can navigate to a page listing their registries.
- Each registry in the list links to its own page.
- If the user has no registries yet, they see an empty-state message and a link to create one.
- The list only shows registries the signed-in user owns, not other users' registries.

## Notes

- Route: `/registries` (index), listing alongside the existing `/registries/new` and `/registries/[id]`.
- The homepage's old direct "Create a gift registry" link now points to `/registries` instead, since that page contains the create link too — avoids two separate entry points into registry management.

## Related Gherkin

[`features/registry/view_my_registries.feature`](../../features/registry/view_my_registries.feature)
