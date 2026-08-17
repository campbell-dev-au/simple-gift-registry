# User Story: Save a shared registry to my account

**As a** guest with a registry's share link
**I want** to save it to my account
**So that** I can find it again later without needing the link a second time

## Acceptance Criteria

- From the share link, a signed-in guest can save the registry to their account — one button, no separate page.
- A signed-out visitor sees a prompt to sign in or create an account instead of a save button.
- Once saved, the guest sees it under "Saved registries" on their "My registries" page, linking back to the same share link — this is a bookmark, not co-ownership: it grants no management access, and viewing/claiming still goes through `/share/[token]` like any other guest.
- A guest can remove a saved registry, either from the share link itself or from their "My registries" page.
- Saving is idempotent per guest — opening the share link and saving again doesn't create duplicate entries.
- The registry's owner doesn't see a save option on their own share link — they already have it in "My registries" as the owner.

## Notes

- **A third kind of registry relationship, distinct from ownership and co-ownership.** `registry_saves` (`registryId`, `savedByUserId`, `createdAt`, unique on the pair) is a new table alongside `registries` and `registry_invitations` — see `docs/stories/invite-co-owner.md` for the co-owner model it's deliberately *not* reusing. A save carries no rights beyond "show this in my list"; it doesn't touch `canManageRegistry` (`src/lib/registry-access.ts`) at all.
- **Save/unsave live with the other share-link actions.** `saveRegistry`/`unsaveRegistry` (`src/app/share/[token]/actions.ts`) mirror `claimGift`/`unclaimGift`'s shape — token-scoped, `auth()`-gated with a `redirect_url` back to the same share link when signed out. Removing a saved registry from the "My registries" page instead uses a separate `removeSavedRegistry(registryId)` in `src/app/registries/actions.ts`, since that page only has the registry id in scope, not its share token — same `WHERE savedByUserId = <current user>` authorization pattern as `unclaimGift`.
- **Idempotent via a database constraint, not just a UI guard.** `saveRegistry` calls `.onConflictDoNothing()` against the `(registryId, savedByUserId)` unique constraint, so re-saving (e.g. a double click, or opening the link again after already saving) is a no-op rather than an error or a duplicate row.
- **The owner-guard is silent, not an error.** Nothing stops an owner from opening their own share link, so `saveRegistry` just returns early when `userId === registry.ownerId` instead of throwing — the share page also doesn't render the save button for them, but the action itself doesn't trust that.
- **A saved registry a viewer also owns or co-owns is only listed once.** The "My registries" page (`src/app/registries/page.tsx`) filters `registry_saves` rows down to ids not already covered by the owned/co-owned list before rendering "Saved registries" — otherwise accepting a co-owner invitation for a registry you'd previously saved would show it twice.
- Saved registries link to `/share/[token]`, not `/registries/[id]` — that keeps claim status and the claim/unclaim controls available, which the owner-facing `/registries/[id]` page deliberately never shows (see `docs/stories/claim-gift.md`).

## Related Gherkin

[`features/registry/save_registry.feature`](../../features/registry/save_registry.feature)
