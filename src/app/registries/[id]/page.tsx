import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, giftClaims, registryInvitations } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Pill } from "@/components/pill";
import { ClaimProgress } from "@/components/claim-progress";
import { Avatar } from "@/components/avatar";
import { IconLink, IconUsers } from "@/components/icons";
import { sectionTitleClass } from "@/components/field";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RegistryTitleEditor } from "@/components/registry-title-editor";
import { GiftList } from "@/components/gift-list";
import { ShareLink } from "@/components/share-link";
import { InviteCoOwnerForm } from "@/components/invite-co-owner-form";
import {
  archiveRegistry,
  unarchiveRegistry,
  regenerateShareLink,
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

  // Everything below the registry row itself only depends on it, so fetch
  // in two parallel waves instead of one query at a time — each of these
  // is a round trip to a remote database (or Clerk's API).
  const [registryGifts, canManage] = await Promise.all([
    db.select().from(gifts).where(eq(gifts.registryId, id)),
    canManageRegistry(db, registry.ownerId, registry.id, userId ?? null),
  ]);

  // Hidden by default even from the owner/co-owners — see reveal_claims in
  // src/db/schema.ts. Guests always see remaining counts on the share page;
  // this only gates what the registry's manager sees.
  const showClaims = canManage && registry.revealClaims;

  // Removing a co-owner is reserved for whoever created the registry — see
  // requirePrimaryOwner in ./actions.ts.
  const isPrimaryOwner = userId === registry.ownerId;

  // Aggregate claimed quantity per gift, never the claimer's identity — even
  // once revealed, the owner gets to see progress, not who claimed what (see
  // gift_claims in src/db/schema.ts for why that boundary exists).
  //
  // The primary owner's email is fetched from Clerk since we only ever
  // store an email for invitation-based co-owners, not the creator; it's
  // shown to accepted co-owners so the "Co-owners" list never lists the
  // viewer themselves.
  const [claims, invitations, primaryOwnerEmail] = await Promise.all([
    !showClaims || registryGifts.length === 0
      ? []
      : db
          .select()
          .from(giftClaims)
          .where(
            inArray(
              giftClaims.giftId,
              registryGifts.map((gift) => gift.id),
            ),
          ),
    canManage
      ? db
          .select()
          .from(registryInvitations)
          .where(eq(registryInvitations.registryId, id))
      : [],
    canManage && !isPrimaryOwner
      ? (async () => {
          try {
            const client = await clerkClient();
            const owner = await client.users.getUser(registry.ownerId);
            return (
              owner.primaryEmailAddress?.emailAddress ??
              owner.emailAddresses[0]?.emailAddress ??
              null
            );
          } catch {
            return null;
          }
        })()
      : null,
  ]);

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

  const otherAcceptedCoOwners = invitations.filter(
    (i) => i.status === "accepted" && i.acceptedByUserId !== userId,
  );
  const pendingInvitations = invitations.filter((i) => i.status === "pending");

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
              <SubmitButton variant="text">
                {registry.archivedAt ? "Unarchive registry" : "Archive registry"}
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {showClaims && totalQuantity > 0 && (
        <ClaimProgress claimed={totalClaimed} total={totalQuantity} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GiftList
          registryId={registry.id}
          canManage={canManage}
          showClaims={showClaims}
          gifts={registryGifts.map((gift) => ({
            id: gift.id,
            name: gift.name,
            notes: gift.notes,
            quantity: gift.quantity,
            claimed: Math.min(claimedByGift.get(gift.id) ?? 0, gift.quantity),
          }))}
        />

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
                    <SubmitButton variant="ghost" size="sm">
                      Hide claim status
                    </SubmitButton>
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
              <ShareLink url={shareUrl} />
              <form action={regenerateShareLink.bind(null, registry.id)}>
                <ConfirmSubmitButton
                  confirmMessage="Get a new share link? The current link stops working immediately — anyone you've already sent it to will need the new one."
                  variant="ghost"
                  size="sm"
                >
                  Get a new share link
                </ConfirmSubmitButton>
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
                      <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">
                        <Avatar email={primaryOwnerEmail} />
                        <span className="break-all">
                          {primaryOwnerEmail} · Owner
                        </span>
                      </span>
                    </li>
                  )}
                  {otherAcceptedCoOwners.map((invitation) => (
                    <li
                      key={invitation.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2.5 text-sm text-ink">
                        <Avatar email={invitation.email} />
                        <span className="break-all">{invitation.email}</span>
                      </span>
                      {isPrimaryOwner && (
                        <form
                          action={removeCoOwner.bind(
                            null,
                            registry.id,
                            invitation.id,
                          )}
                        >
                          <ConfirmSubmitButton
                            confirmMessage={`Remove ${invitation.email} as a co-owner? They'll lose access to managing this registry.`}
                            variant="text"
                            size="sm"
                            aria-label={`Remove co-owner ${invitation.email}`}
                          >
                            Remove
                          </ConfirmSubmitButton>
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
                        <span className="min-w-0 break-all text-sm text-ink-dim">
                          {invitation.email}
                        </span>
                        <form
                          action={cancelInvitation.bind(
                            null,
                            registry.id,
                            invitation.id,
                          )}
                        >
                          <SubmitButton
                            variant="text"
                            size="sm"
                            aria-label={`Cancel invitation to ${invitation.email}`}
                          >
                            Cancel
                          </SubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <InviteCoOwnerForm registryId={registry.id} />
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
