import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, registryInvitations, registrySaves } from "@/db/schema";
import {
  acceptInvitation,
  declineInvitation,
  removeSavedRegistry,
} from "./actions";

export default async function RegistriesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();

  const ownedRegistries = await db
    .select()
    .from(registries)
    .where(eq(registries.ownerId, userId));

  const coOwnedRegistries = await db
    .select({
      id: registries.id,
      title: registries.title,
      eventDate: registries.eventDate,
      archivedAt: registries.archivedAt,
      ownerId: registries.ownerId,
      shareToken: registries.shareToken,
      createdAt: registries.createdAt,
    })
    .from(registryInvitations)
    .innerJoin(registries, eq(registryInvitations.registryId, registries.id))
    .where(
      and(
        eq(registryInvitations.status, "accepted"),
        eq(registryInvitations.acceptedByUserId, userId),
      ),
    );

  const myRegistries = [...ownedRegistries, ...coOwnedRegistries];
  const myRegistryIds = new Set(myRegistries.map((r) => r.id));

  const savedRegistriesRaw = await db
    .select({
      id: registries.id,
      title: registries.title,
      shareToken: registries.shareToken,
    })
    .from(registrySaves)
    .innerJoin(registries, eq(registrySaves.registryId, registries.id))
    .where(eq(registrySaves.savedByUserId, userId));

  // A saved registry the viewer also owns or co-owns (e.g. saved before
  // accepting a co-owner invitation) already appears above — no need to
  // list the same registry twice.
  const savedRegistries = savedRegistriesRaw.filter(
    (r) => !myRegistryIds.has(r.id),
  );

  const user = await currentUser();
  const verifiedEmails = (user?.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());

  const pendingInvitations =
    verifiedEmails.length === 0
      ? []
      : await db
          .select({
            id: registryInvitations.id,
            email: registryInvitations.email,
            registryTitle: registries.title,
          })
          .from(registryInvitations)
          .innerJoin(
            registries,
            eq(registryInvitations.registryId, registries.id),
          )
          .where(
            and(
              eq(registryInvitations.status, "pending"),
              inArray(registryInvitations.email, verifiedEmails),
            ),
          );

  const activeRegistries = myRegistries.filter((r) => !r.archivedAt);
  const archivedRegistries = myRegistries.filter((r) => r.archivedAt);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">My registries</h1>

      {pendingInvitations.length > 0 && (
        <section className="flex w-full max-w-md flex-col gap-3 text-left">
          <h2 className="text-lg font-medium">Invitations</h2>
          <ul className="flex flex-col gap-2">
            {pendingInvitations.map((invitation) => (
              <li key={invitation.id} className="rounded border p-3">
                <p>
                  You&apos;ve been invited to co-own{" "}
                  <span className="font-medium">
                    {invitation.registryTitle}
                  </span>
                  .
                </p>
                <div className="mt-2 flex gap-3">
                  <form
                    action={acceptInvitation.bind(null, invitation.id)}
                  >
                    <button type="submit" className="text-sm underline">
                      Accept
                    </button>
                  </form>
                  <form
                    action={declineInvitation.bind(null, invitation.id)}
                  >
                    <button type="submit" className="text-sm underline">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {myRegistries.length === 0 ? (
        <p className="text-gray-500">You don&apos;t have any registries yet.</p>
      ) : activeRegistries.length === 0 ? (
        <p className="text-gray-500">You don&apos;t have any active registries.</p>
      ) : (
        <ul className="flex w-full max-w-md flex-col gap-2 text-left">
          {activeRegistries.map((registry) => (
            <li key={registry.id} className="rounded border p-3">
              <Link
                href={`/registries/${registry.id}`}
                className="font-medium underline"
              >
                {registry.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/registries/new" className="underline">
        Create a gift registry
      </Link>

      {savedRegistries.length > 0 && (
        <section className="flex w-full max-w-md flex-col gap-3 text-left">
          <h2 className="text-lg font-medium">Saved registries</h2>
          <ul className="flex flex-col gap-2">
            {savedRegistries.map((registry) => (
              <li
                key={registry.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <Link
                  href={`/share/${registry.shareToken}`}
                  className="font-medium underline"
                >
                  {registry.title}
                </Link>
                <form action={removeSavedRegistry.bind(null, registry.id)}>
                  <button
                    type="submit"
                    aria-label={`Remove ${registry.title} from my registries`}
                    className="text-sm underline"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {archivedRegistries.length > 0 && (
        <section className="flex w-full max-w-md flex-col gap-3 text-left">
          <h2 className="text-lg font-medium">Archived registries</h2>
          <ul className="flex flex-col gap-2">
            {archivedRegistries.map((registry) => (
              <li key={registry.id} className="rounded border p-3">
                <Link
                  href={`/registries/${registry.id}`}
                  className="font-medium underline"
                >
                  {registry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
