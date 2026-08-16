# User Story: Create a gift registry

**As a** signed-in user
**I want** to create a gift registry
**So that** I have a place to list gifts I'd like to receive

## Acceptance Criteria

- A signed-out visitor cannot reach the create-registry page; they're redirected to sign in.
- A signed-in user can navigate to "create a registry" from the homepage.
- They submit a title (and optionally an event date).
- The registry is saved and they land on their new registry's page, showing its title.

## Notes

- Registries are persisted in Postgres (Neon, via the Vercel Marketplace) using Drizzle ORM. Schema: `src/db/schema.ts`; migrations: `drizzle/`.
- `/registries/*` routes require authentication, enforced in `src/proxy.ts` via `auth.protect()`.
- The functional test arranges its signed-in precondition the same way as [`sign-out.md`](sign-out.md): `clerk.signIn()` from `@clerk/testing/playwright`, with the account seeded via the Backend API.
- Ownership isn't enforced yet beyond recording `ownerId` on the row — anyone signed in can currently view any registry by ID. Restricting viewing/editing to the owner is a follow-up, not required by this story's acceptance criteria.

## Related Gherkin

[`features/registry/create_registry.feature`](../../features/registry/create_registry.feature)
