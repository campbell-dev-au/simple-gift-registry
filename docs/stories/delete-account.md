# User Story: Delete my data or my account

**As an** account holder
**I want** to delete everything I've stored, or the whole account
**So that** nothing about me is kept when I stop using the site

## Acceptance Criteria

- From my account page I can delete all my data: every registry I own (its gifts, guests' claims, invitations, and saves go with it), plus my claims, saves, and co-ownerships on other people's registries, and pending invitations addressed to my verified emails. My account and sign-in survive.
- From the same page I can delete my account entirely — the data wipe above, then the account itself. I end up signed out on the homepage.
- Both actions require an explicit confirmation and cannot be undone.

## Notes

- Invitations I *sent* on registries I don't own are kept — those rows belong to the registry, and the invited person's standing shouldn't vanish because the inviter left.
- Account deletion wipes app data **before** deleting the Clerk user, so a Clerk failure can't strand data no account can reach (see `src/app/account/actions.ts`).
- The action returns success rather than redirecting: deleting the Clerk user revokes the session server-side, but the browser's short-lived session JWT verifies for up to a minute more, so the client runs Clerk's `signOut` to clear the local session at the same moment (see `AccountDangerZone`).

## Related Gherkin

[`features/account/delete_account.feature`](../../features/account/delete_account.feature)
