# User Story: Protect a registry with a password

**As a** registry owner
**I want** to require a password before guests can open my share link
**So that** the registry stays private even if the link is forwarded further than I intended

## Acceptance Criteria

- From my registry page I can set, change, or remove a share password.
- A guest opening the share link is asked for the password before seeing any gifts (the registry title is still shown, so they know they're in the right place).
- A wrong password shows an inline message and keeps the registry hidden.
- A correct password unlocks the registry for that browser (about 30 days), without needing an account.
- Owners and co-owners are never asked for the password on their own registry.
- Changing or removing the password takes effect for everyone immediately — previously unlocked browsers must enter the new password.

## Notes

- The password is stored as an scrypt hash on the registry (`share_password_hash`), never in plain text — see `src/lib/share-password.ts`.
- Unlocking sets an httpOnly cookie whose value is an HMAC of the registry id *keyed by the stored hash*: no separate cookie secret to provision, a cookie for one registry proves nothing about another, and rotating the password invalidates every outstanding cookie at once.
- The page gate is presentation only; every server action reachable from the share page re-checks the unlock cookie (`requireShareUnlock` in `src/app/share/[token]/actions.ts`). Unclaim/unsave stay ungated deliberately — they only ever remove the caller's own rows.
- scrypt's ~100ms cost is the only brute-force throttle for now; per-IP rate limiting (e.g. Vercel WAF) is a follow-up.

## Related Gherkin

[`features/registry/protect_registry.feature`](../../features/registry/protect_registry.feature)
