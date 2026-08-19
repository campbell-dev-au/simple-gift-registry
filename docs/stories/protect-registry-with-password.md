# User Story: Protect a registry with a password

**As a** registry owner
**I want** to require a password before guests can open my share link
**So that** the registry stays private even if the link is forwarded further than I intended

## Acceptance Criteria

- From my registry page I can set, change, or remove a share password.
- Once set, I can see the password again password-manager style: hidden by default, with Show and Copy controls — so I can re-send it to a guest months later without resetting it.
- A guest opening the share link is asked for the password before seeing any gifts (the registry title is still shown, so they know they're in the right place).
- A wrong password shows an inline message and keeps the registry hidden.
- A correct password unlocks the registry for that browser (about 30 days), without needing an account.
- Owners and co-owners are never asked for the password on their own registry.
- Changing or removing the password takes effect for everyone immediately — previously unlocked browsers must enter the new password.

## Notes

- The password is stored **encrypted** (AES-256-GCM, key from the `SHARE_PASSWORD_KEY` env var), not hashed — deliberately, since the owner must be able to re-view it. That's the right trade-off because a share password is an access code the owner hands out, not a personal credential — but people reuse passwords, so it still never sits in the database as plaintext. See `src/lib/share-password.ts`.
- The manage page decrypts it server-side for the Show/Copy controls; that section only renders for owners/co-owners — the same trust boundary that could set the password in the first place.
- Unlocking sets an httpOnly cookie whose value is an HMAC of the registry id *keyed by the stored ciphertext*: no separate cookie secret, a cookie for one registry proves nothing about another, and the random IV means every set produces a new ciphertext — rotating the password invalidates every outstanding cookie at once.
- The page gate is presentation only; every server action reachable from the share page re-checks the unlock cookie (`requireShareUnlock` in `src/app/share/[token]/actions.ts`). Unclaim/unsave stay ungated deliberately — they only ever remove the caller's own rows.
- A wrong guess costs a flat 500ms server-side delay; per-IP rate limiting (e.g. Vercel WAF) is a follow-up.
- `SHARE_PASSWORD_KEY` lives in Vercel env (distinct values for production vs development/preview); CI uses a fixed test-only key. Rotating it makes existing stored passwords undecryptable — owners would just set them again.

## Related Gherkin

[`features/registry/protect_registry.feature`](../../features/registry/protect_registry.feature)
