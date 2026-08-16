# User Story: Sign in to an existing account

**As a** registered user
**I want** to sign in with my email address and password
**So that** I can access my own gift registry on a return visit

## Acceptance Criteria

- From the homepage, a signed-out visitor can navigate to a sign-in page.
- The visitor can submit their email address and password.
- On a browser/device Clerk hasn't seen before, the visitor is asked to confirm a one-time code sent to their email before the sign-in completes (Clerk's device-trust check — this fires even without MFA enabled).
- On correct credentials, the visitor is signed in and returned to the homepage, which reflects the signed-in state.
- On incorrect credentials, the visitor stays on the sign-in page and sees an error — this is not yet covered by a scenario (see Notes).

## Notes

- Complements [`create-account.md`](create-account.md), which was scoped to sign-up only.
- Signing in requires an account to already exist. The functional test creates one directly via Clerk's Backend API (`@clerk/backend`) before the scenario runs, rather than through the UI sign-up flow — this keeps the sign-in scenario independent and fast, and is standard practice for BDD test data: set up state via API, exercise behaviour via UI. The test user is deleted afterwards.
- Every Playwright browser context looks like a brand-new device to Clerk, so the scenario always goes through the device-trust email-code step (`signIn.status === 'needs_client_trust'`). This isn't test-only behaviour — a real first-time sign-in from a new browser hits the same step.
- The "incorrect password" / error-state scenario is deliberately left out of this pass to keep scope tight; add it as a follow-up scenario in the same feature file when needed.

## Related Gherkin

[`features/account/sign_in.feature`](../../features/account/sign_in.feature)
