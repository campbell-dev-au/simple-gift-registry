# User Story: Invite a co-owner to a gift registry

**As a** registry owner
**I want** to invite another person to help manage my registry
**So that** we can share the work of keeping it up to date, without either of us seeing who claimed what

## Acceptance Criteria

- From their registry page, an owner (or an existing co-owner — see Notes) can invite someone by email address.
- An invitation is **pending** until the invited person accepts or declines it — there's no immediate access.
- The invited person sees pending invitations addressed to their (verified) email on their "My registries" page once they're signed in, and can accept or decline from there. A notification email also goes out when the invitation is created (added in a later pass — see Notes); it points them at their registries page but plays no part in acceptance.
- Accepting adds the registry to the invitee's "My registries" list and gives them the same management access as the owner: editing the registry and its gifts, archiving, regenerating the share link, and inviting further co-owners.
- Declining leaves the registry out of their list and the invitation inert.
- A co-owner does **not** see who has claimed which gifts, for the same reason the original owner doesn't — the registry's own page never surfaces claim data (see `docs/stories/claim-gift.md`); that holds regardless of how many people manage the registry.
- The owner can cancel a still-pending invitation.
- Only the person who originally created the registry can remove an accepted co-owner — a co-owner cannot remove the owner or another co-owner (deliberate: asked and confirmed when this story was built).
- The "Co-owners" list never includes the person currently looking at it. The owner sees the other co-owners (unchanged); a co-owner sees the *original owner* plus any other co-owners — not a listing that includes themselves.

## Notes

- **Invited by email, matched on login — no invite link.** There's no token-based link to click. The owner types the invitee's email; a `registry_invitations` row is created with `status: "pending"`. When *any* signed-in user visits `/registries`, pending invitations addressed to one of their Clerk account's **verified** email addresses show up there with Accept/Decline controls. The notification email (below) was added later exactly as the pure addition this design anticipated — it tells the invitee their invite is waiting and links to `/registries`, but acceptance works identically with or without it.
- **The notification email is best-effort, never load-bearing.** `sendCoOwnerInviteEmail` (`src/lib/invite-email.ts`) sends via Resend (provisioned through the Vercel Marketplace; `RESEND_API_KEY`, sender overridable via `EMAIL_FROM`). It's queued with `waitUntil` after the response — the Clerk lookup for the inviter's display name shouldn't slow the form — and only when a row was genuinely inserted *and* email is configured: an idempotent re-invite of the same address re-sends nothing, and environments without the key (local dev, BDD runs) skip sending entirely, which is also why the BDD suite needs no email stubbing. Send failures are logged and swallowed; the invitation row is the source of truth. The action reports whether an email was queued (`emailed` on `ActionResult`) so the form's success message doesn't claim an email that didn't go out.
- **One row is the whole lifecycle.** `registry_invitations` (`registryId`, `email`, `invitedByUserId`, `status`, `acceptedByUserId`, `createdAt`, `respondedAt`) has no separate co-owner/membership table — a row with `status: "accepted"` *is* the co-owner record. `acceptedByUserId` is only set on acceptance, since the email alone doesn't guarantee a Clerk account exists yet at invite time.
- **Full parity for inviting and managing, not for removing.** Any owner or accepted co-owner can invite further co-owners and has identical management rights over the registry and its gifts (`canManageRegistry`, `src/lib/registry-access.ts`, shared between pages and server actions). Removing an *accepted* co-owner is the one exception — restricted to `registry.ownerId` specifically (`requirePrimaryOwner`, `src/app/registries/[id]/actions.ts`), so a co-owner can't remove the person who created the registry or another co-owner. Canceling a still-*pending* invitation uses the regular owner-or-co-owner check, since nothing has been granted yet.
- **Only verified emails can accept.** `acceptInvitation`/`declineInvitation` (`src/app/registries/actions.ts`) re-check that the invitation's email appears among the current user's *verified* Clerk email addresses before acting — the `/registries` page only using verified emails to decide what to display is a UI convenience, not the authorization boundary.
- **Privacy needed no new work.** The registry's own page (`src/app/registries/[id]/page.tsx`) never queries `gift_claims` at all, for owner or co-owner alike — the "don't see who claimed what" requirement is a consequence of that page's existing shape, not something added for this story.
- **The Co-owners list excludes the viewer, and shows the primary owner in their place when needed.** First shipped listing every accepted `registry_invitations` row unconditionally, which meant a co-owner saw *themselves* in their own "Co-owners" list — confusing, and reported as a bug immediately after. Fixed by filtering out `acceptedByUserId === userId` and, only when the viewer isn't the primary owner, fetching the owner's email via `clerkClient().users.getUser(registry.ownerId)` (`src/app/registries/[id]/page.tsx`) to show in their place — a real Clerk API lookup rather than something stored locally, since (unlike invited co-owners) the creator's email was never captured anywhere. That lookup only runs for co-owner viewers, not for the owner viewing their own page, to avoid the extra API call on the common path.

## Related Gherkin

[`features/registry/invite_co_owner.feature`](../../features/registry/invite_co_owner.feature)
