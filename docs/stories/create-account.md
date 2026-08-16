# User Story: Create an account

**As a** visitor
**I want** to create an account using my email address and a password
**So that** I can access my own gift registry

## Acceptance Criteria

- From the homepage, a visitor can navigate to a sign-up page.
- The visitor can submit an email address and a password to start creating an account.
- The visitor must verify their email address with a code before the account is activated.
- Once verified, the visitor is signed in automatically and returned to the homepage.
- The homepage reflects the signed-in state by showing the account's email address.

## Notes

- Account creation is handled by Clerk (see `src/proxy.ts`, `src/app/sign-up/page.tsx`). Clerk owns credential storage, password hashing, and email verification delivery.
- Functional tests use Clerk's `+clerk_test` email convention and fixed `424242` verification code so scenarios run deterministically without sending real email.

## Related Gherkin

[`features/account/create_account.feature`](../../features/account/create_account.feature)
