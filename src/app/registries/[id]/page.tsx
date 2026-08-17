import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registryInvitations } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";
import { Button, buttonClasses } from "@/components/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Pill } from "@/components/pill";
import { ClaimProgress } from "@/components/claim-progress";
import { Avatar } from "@/components/avatar";
import { IconLink, IconUsers, IconGift } from "@/components/icons";
import { inputClass, labelClass, sectionTitleClass } from "@/components/field";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EMAIL_MAX_LENGTH } from "@/lib/field-limits";
import { RegistryTitleEditor } from "@/components/registry-title-editor";
import { AddGiftForm } from "@/components/add-gift-form";
import { GiftCard } from "@/components/gift-card";
import {
  archiveRegistry,
  unarchiveRegistry,
  regenerateShareLink,
  inviteCoOwner,
  cancelInvitation,
  removeCoOwner,
  setClaimVisibility,
} from "./actions";

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const { userId } = await auth();

  const db = getDb();
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.id, id));

  if (!registry) notFound();

  const registryGifts = await db
    .select()
    .from(gifts)
    .where(eq(gifts.registryId, id));

  const canManage = await canManageRegistry(db, registry.ownerId, registry.id, userId ?? null);
  // Hidden by default even from the owner/co-owners — see reveal_claims in
  // src/db/schema.ts. Guests always see remaining counts on the share page;
  // this only gates what the registry's manager sees.
  const showClaims = canManage && registry.revealClaims;

  // Aggregate claimed quantity per gift, never the claimer's identity — even
  // once revealed, the owner gets to see progress, not who claimed what (see
  // gift_claims in src/db/schema.ts for why that boundary exists).
  const claims =
    !showClaims || registryGifts.length === 0
      ? []
      : await db
          .select()
          .from(giftClaims)
          .where(
            inArray(
              giftClaims.giftId,
              registryGifts.map((gift) => gift.id),
            ),
          );
  const claimedByGift = new Map<string, number>();
  for (const claim of claims) {
    claimedByGift.set(
      claim.giftId,
      (claimedByGift.get(claim.giftId) ?? 0) + claim.quantity,
    );
  }
  const totalQuantity = registryGifts.reduce((sum, g) => sum + g.quantity, 0);
  const totalClaimed = registryGifts.reduce(
    (sum, g) =>
      sum + Math.min(claimedByGift.get(g.id) ?? 0, g.quantity),
    0,
  );

  // Removing a co-owner is reserved for whoever created the registry — see
  // requirePrimaryOwner in ./actions.ts.
  const isPrimaryOwner = userId === registry.ownerId;

  const invitations = canManage
    ? await db
        .select()
        .from(registryInvitations)
        .where(eq(registryInvitations.registryId, id))
    : [];
  // Never list the viewer themselves as a "co-owner" of their own registry —
  // for an accepted co-owner viewing the page, that means showing the
  // *primary* owner here instead (fetched from Clerk since we only ever
  // store an email for invitation-based co-owners, not the creator).
  const otherAcceptedCoOwners = invitations.filter(
    (i) => i.status === "accepted" && i.acceptedByUserId !== userId,
  );
  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  let primaryOwnerEmail: string | null = null;
  if (canManage && !isPrimaryOwner) {
    try {
      const client = await clerkClient();
      const owner = await client.users.getUser(registry.ownerId);
      primaryOwnerEmail =
        owner.primaryEmailAddress?.emailAddress ??
        owner.emailAddresses[0]?.emailAddress ??
        null;
    } catch {
      primaryOwnerEmail = null;
    }
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const shareUrl = `${protocol}://${host}/share/${registry.shareToken}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My registries", href: "/registries" },
          { label: registry.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <RegistryTitleEditor
          registryId={registry.id}
          title={registry.title}
          eventDate={registry.eventDate}
          canManage={canManage}
        />
        <div className="flex flex-col items-end gap-2">
          {registry.archivedAt && <Pill tone="neutral">Archived</Pill>}
          {canManage && (
            <form
              action={
                registry.archivedAt
                  ? unarchiveRegistry.bind(null, registry.id)
                  : archiveRegistry.bind(null, registry.id)
              }
            >
              <button type="submit" className={buttonClasses("text")}>
                {registry.archivedAt ? "Unarchive registry" : "Archive registry"}
              </button>
            </form>
          )}
        </div>
      </div>

      {showClaims && totalQuantity > 0 && (
        <ClaimProgress claimed={totalClaimed} total={totalQuantity} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {canManage && <AddGiftForm registryId={registry.id} />}

          <section className="flex flex-col gap-3">
            <h2 className={`${sectionTitleClass} flex items-center gap-2`}>
              <IconGift className="text-violet" />
              Gifts
            </h2>
            {registryGifts.length === 0 ? (
              <p className="text-sm text-ink-dim">No gifts yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {registryGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    registryId={registry.id}
                    canManage={canManage}
                    showClaims={showClaims}
                    claimed={Math.min(
                      claimedByGift.get(gift.id) ?? 0,
                      gift.quantity,
                    )}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {canManage && (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <h2 className={sectionTitleClass}>Claim status</h2>
              {registry.revealClaims ? (
                <>
                  <p className="text-sm text-ink-dim">
                    You can see which gifts are claimed and how many are
                    left.
                  </p>
                  <form action={setClaimVisibility.bind(null, registry.id, false)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Hide claim status
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-dim">
                    Hidden by default, so gifts stay a surprise for you.
                    Guests can always see what&apos;s still needed on your
                    share link.
                  </p>
                  <form action={setClaimVisibility.bind(null, registry.id, true)}>
                    <ConfirmSubmitButton
                      confirmMessage="Show which gifts have been claimed on this registry? This can spoil the surprise — you still won't see who claimed what, only what's left."
                      variant="ghost"
                      size="sm"
                    >
                      Show claim status
                    </ConfirmSubmitButton>
                  </form>
                </>
              )}
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <h2 className={`${sectionTitleClass} flex items-center gap-2`}>
                <IconLink className="text-violet" />
                Share this registry
              </h2>
              <label htmlFor="share-link" className="sr-only">
                Share link
              </label>
              <input
                id="share-link"
                readOnly
                value={shareUrl}
                className={`${inputClass} font-mono text-xs`}
              />
              <form action={regenerateShareLink.bind(null, registry.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Get a new share link
                </Button>
              </form>
            </section>

            <section
              data-testid="co-owners-section"
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
            >
              <h2 className={`${sectionTitleClass} flex items-center gap-2`}>
                <IconUsers className="text-violet" />
                Co-owners
              </h2>
              {!primaryOwnerEmail && otherAcceptedCoOwners.length === 0 ? (
                <p className="text-sm text-ink-dim">No co-owners yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {primaryOwnerEmail && (
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-2.5">
                      <span className="flex items-center gap-2.5 text-sm text-ink">
                        <Avatar email={primaryOwnerEmail} />
                        {primaryOwnerEmail} · Owner
                      </span>
                    </li>
                  )}
                  {otherAcceptedCoOwners.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-2.5"
                    >
                      <span className="flex items-center gap-2.5 text-sm text-ink">
                        <Avatar email={invitation.email} />
                        {invitation.email}
                      </span>
                      {isPrimaryOwner && (
                        <form
                          action={removeCoOwner.bind(
                            null,
                            registry.id,
                            invitation.id,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={`Remove co-owner ${invitation.email}`}
                            className={buttonClasses("text", "sm")}
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {pendingInvitations.length > 0 && (
                <>
                  <h3 className="text-xs font-semibold tracking-wide text-ink-dim uppercase">
                    Pending invitations
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {pendingInvitations.map((invitation) => (
                      <li
                        key={invitation.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-2.5"
                      >
                        <span className="text-sm text-ink-dim">
                          {invitation.email}
                        </span>
                        <form
                          action={cancelInvitation.bind(
                            null,
                            registry.id,
                            invitation.id,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={`Cancel invitation to ${invitation.email}`}
                            className={buttonClasses("text", "sm")}
                          >
                            Cancel
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <form
                action={inviteCoOwner.bind(null, registry.id)}
                className="flex flex-col gap-2"
              >
                <label htmlFor="co-owner-email" className={labelClass}>
                  Invite a co-owner
                </label>
                <div className="flex gap-2">
                  <input
                    id="co-owner-email"
                    name="email"
                    type="email"
                    required
                    maxLength={EMAIL_MAX_LENGTH}
                    className={inputClass}
                  />
                  <Button type="submit" size="sm">
                    Invite
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
