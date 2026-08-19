# User Story: Registry privacy and limits

**As the** person running the site
**I want** management pages private to their owners and per-account limits enforced
**So that** strangers can't read registries they weren't given a link to, and a scripted account can't fill the database

## Acceptance Criteria

- `/registries/[id]` is only readable by the registry's owner or an accepted co-owner; everyone else gets a 404, exactly as if the registry didn't exist. Guests always go through `/share/[token]`.
- An account can own at most 20 registries; hitting the cap shows an inline message on the create form.
- A registry can have at most 10 co-owners plus pending invitations; hitting the cap shows an inline message on the invite form.
- (Existing) a registry can have at most 50 gifts.

## Notes

- The management-page gate is what makes share-link rotation meaningful: the registry `id` can't be rotated, so it must never work as a read-only back door — e.g. for a removed co-owner who still has the URL in their history.
- Caps live in `src/lib/field-limits.ts` (`REGISTRY_COUNT_MAX`, `INVITE_COUNT_MAX`) and are deliberately far above what a real household needs — they exist as abuse limits, not product decisions.
- Cap errors come back as typed action results rendered inline (see `src/lib/action-result.ts`), not thrown — a thrown error only reaches the generic "try again" boundary, which is wrong advice for input that can never succeed.
- A partial unique index on `registry_invitations (registry_id, email) WHERE status <> 'declined'` backs the invite cap's check-then-insert against double-submit races.

## Related Gherkin

[`features/registry/registry_limits.feature`](../../features/registry/registry_limits.feature)
