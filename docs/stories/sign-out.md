# User Story: Sign out

**As a** signed-in user
**I want** to sign out
**So that** I can end my session, especially on a shared or public device

## Acceptance Criteria

- While signed in, the homepage shows a "Sign out" control.
- Choosing to sign out ends the session and returns the user to the signed-out homepage.

## Notes

- The functional test establishes the signed-in precondition via `clerk.signIn()` from `@clerk/testing/playwright` (a testing helper that creates a session directly, bypassing the sign-in UI and any verification/device-trust steps) rather than driving the sign-in feature's UI — this scenario is about sign-out, so sign-in is arranged, not exercised. The account itself is still seeded via the Backend API and cleaned up afterwards, same as [`sign-in.md`](sign-in.md).

## Related Gherkin

[`features/account/sign_out.feature`](../../features/account/sign_out.feature)
