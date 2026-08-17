import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts, registryInvitations } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";
import {
  addGift,
  deleteGift,
  archiveRegistry,
  unarchiveRegistry,
  regenerateShareLink,
  inviteCoOwner,
  cancelInvitation,
  removeCoOwner,
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
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">{registry.title}</h1>
        {registry.eventDate && <p>Event date: {registry.eventDate}</p>}
        {registry.archivedAt && (
          <p className="text-sm text-gray-500">Archived</p>
        )}
        {canManage && (
          <div className="mt-2 flex justify-center gap-3">
            <Link
              href={`/registries/${registry.id}/edit`}
              className="underline"
            >
              Edit registry
            </Link>
            {registry.archivedAt ? (
              <form action={unarchiveRegistry.bind(null, registry.id)}>
                <button type="submit" className="underline">
                  Unarchive registry
                </button>
              </form>
            ) : (
              <form action={archiveRegistry.bind(null, registry.id)}>
                <button type="submit" className="underline">
                  Archive registry
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {canManage && (
        <section className="flex w-full max-w-md flex-col gap-2 text-left">
          <h2 className="text-lg font-medium">Share this registry</h2>
          <label htmlFor="share-link" className="text-sm font-medium">
            Share link
          </label>
          <input
            id="share-link"
            readOnly
            value={shareUrl}
            className="w-full rounded border px-3 py-2"
          />
          <form action={regenerateShareLink.bind(null, registry.id)}>
            <button type="submit" className="text-sm underline">
              Get a new share link
            </button>
          </form>
        </section>
      )}

      {canManage && (
        <section className="flex w-full max-w-md flex-col gap-3 text-left">
          <h2 className="text-lg font-medium">Co-owners</h2>
          {!primaryOwnerEmail && otherAcceptedCoOwners.length === 0 ? (
            <p className="text-sm text-gray-500">No co-owners yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {primaryOwnerEmail && (
                <li className="flex items-center justify-between rounded border p-3">
                  <span>{primaryOwnerEmail} (owner)</span>
                </li>
              )}
              {otherAcceptedCoOwners.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span>{invitation.email}</span>
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
                        className="text-sm underline"
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
              <h3 className="text-sm font-medium">Pending invitations</h3>
              <ul className="flex flex-col gap-2">
                {pendingInvitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <span>{invitation.email}</span>
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
                        className="text-sm underline"
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
            className="flex items-end gap-2"
          >
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="co-owner-email" className="text-sm font-medium">
                Invite a co-owner
              </label>
              <input
                id="co-owner-email"
                name="email"
                type="email"
                required
                className="rounded border px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-black px-3 py-2 text-sm text-white"
            >
              Invite
            </button>
          </form>
        </section>
      )}

      <section className="flex w-full max-w-md flex-col gap-3 text-left">
        <h2 className="text-lg font-medium">Gifts</h2>
        {registryGifts.length === 0 ? (
          <p className="text-gray-500">No gifts yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {registryGifts.map((gift) => (
              <li key={gift.id} className="rounded border p-3">
                <p className="font-medium">{gift.name}</p>
                <p className="text-sm text-gray-500">
                  Quantity: {gift.quantity}
                </p>
                {gift.notes && (
                  <p className="text-sm text-gray-500">{gift.notes}</p>
                )}
                {canManage && (
                  <div className="mt-2 flex gap-3">
                    <Link
                      href={`/registries/${registry.id}/gifts/${gift.id}/edit`}
                      aria-label={`Edit ${gift.name}`}
                      className="text-sm underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteGift.bind(null, registry.id, gift.id)}>
                      <button
                        type="submit"
                        aria-label={`Remove ${gift.name}`}
                        className="text-sm underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage && (
        <form
          action={addGift.bind(null, registry.id)}
          className="flex w-full max-w-md flex-col gap-3 text-left"
        >
          <h2 className="text-lg font-medium">Add a gift</h2>

          <label htmlFor="name" className="text-sm font-medium">
            Gift name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="rounded border px-3 py-2"
          />

          <label htmlFor="notes" className="text-sm font-medium">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            className="rounded border px-3 py-2"
          />

          <label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            defaultValue={1}
            className="rounded border px-3 py-2"
          />

          <button
            type="submit"
            className="rounded bg-black py-2 text-white"
          >
            Add gift
          </button>
        </form>
      )}
    </main>
  );
}
