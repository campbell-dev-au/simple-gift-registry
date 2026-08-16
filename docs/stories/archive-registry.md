# User Story: Archive a registry

**As a** registry owner
**I want** to archive a registry I no longer need active
**So that** it stops cluttering my active registry list without losing its data

## Acceptance Criteria

- From my registry page, I can archive it. It's marked "Archived" and no longer appears in the active section of "My registries" — it moves to a separate "Archived registries" section instead.
- Archiving is reversible: an archived registry has an "Unarchive registry" control that restores it to the active list.
- Only the registry's owner can archive or unarchive it.

## Notes

- `archivedAt` is a nullable timestamp on `registries` (not a boolean) — records *when* it was archived, consistent with `createdAt`, and null cleanly means "active."
- Archiving does **not** restrict viewing, editing, or managing gifts on the registry — it only affects whether it shows in the active list. There was no stated requirement to freeze an archived registry's contents, and doing so would add a second permission dimension (archived-but-still-owner) without a concrete need for it yet.
- Ownership enforcement reuses the same `requireOwnedRegistry` helper as every other mutation on `src/app/registries/[id]/actions.ts` — already covered by the non-owner scenarios on [`edit-registry.md`](edit-registry.md) and [`add-gift.md`](add-gift.md), so this story doesn't repeat a dedicated non-owner scenario.

## Related Gherkin

[`features/registry/archive_registry.feature`](../../features/registry/archive_registry.feature)
