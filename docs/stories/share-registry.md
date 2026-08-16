# User Story: Share a registry

**As a** registry owner
**I want** to share my registry with a link
**So that** people can view it and claim gifts without needing an account

## Acceptance Criteria

- My registry page shows a shareable link.
- Anyone with the link can view the registry without signing in.
- I can regenerate the link, which invalidates the old one — useful if it's been shared more widely than intended.

## Notes

- The share link uses a separate `shareToken` (a random UUID, DB-generated), not the registry's own `id` — decouples the public capability from the internal identifier, so regenerating doesn't touch the registry's real id or any foreign keys pointing at it.
- `/share/[token]` is a new top-level route, deliberately outside `/registries/*` so it's never covered by `src/proxy.ts`'s `auth.protect()` — it needs to stay reachable with no sign-in at all.
- Regeneration doesn't redirect the owner anywhere; the same registry page just re-renders with the new link in place.

## Related Gherkin

[`features/registry/share_registry.feature`](../../features/registry/share_registry.feature)
