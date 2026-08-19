import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, inArray } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, registryInvitations, registrySaves } from "@/db/schema";
import { getClaimSummaries } from "@/lib/registry-claims";
import { formatEventDate } from "@/lib/format-date";
import { buttonClasses } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { ClaimProgress } from "@/components/claim-progress";
import { sectionTitleClass } from "@/components/field";
import {
  acceptInvitation,
  declineInvitation,
  removeSavedRegistry,
} from "./actions";

export default async function RegistriesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();

  // These four are independent, and each is a full round trip (remote
  // Postgres; currentUser() is a Clerk API call) — running them
  // sequentially was most of this page's load time.
  const [ownedRegistries, coOwnedRegistries, savedRegistriesRaw, user] =
    await Promise.all([
      db.select().from(registries).where(eq(registries.ownerId, userId)),
      db
        .select({
          id: registries.id,
          title: registries.title,
          eventDate: registries.eventDate,
          archivedAt: registries.archivedAt,
          ownerId: registries.ownerId,
          shareToken: registries.shareToken,
          revealClaims: registries.revealClaims,
          createdAt: registries.createdAt,
        })
        .from(registryInvitations)
        .innerJoin(
          registries,
          eq(registryInvitations.registryId, registries.id),
        )
        .where(
          and(
            eq(registryInvitations.status, "accepted"),
            eq(registryInvitations.acceptedByUserId, userId),
          ),
        ),
      db
        .select({
          id: registries.id,
          title: registries.title,
          shareToken: registries.shareToken,
        })
        .from(registrySaves)
        .innerJoin(registries, eq(registrySaves.registryId, registries.id))
        .where(eq(registrySaves.savedByUserId, userId)),
      currentUser(),
    ]);

  const myRegistries = [...ownedRegistries, ...coOwnedRegistries];
  const myRegistryIds = new Set(myRegistries.map((r) => r.id));

  // A saved registry the viewer also owns or co-owns (e.g. saved before
  // accepting a co-owner invitation) already appears above — no need to
  // list the same registry twice.
  const savedRegistries = savedRegistriesRaw.filter(
    (r) => !myRegistryIds.has(r.id),
  );

  const verifiedEmails = (user?.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());

  // Only pull claim data for registries the viewer has explicitly opted
  // into seeing (see reveal_claims in src/db/schema.ts) — owned/co-owned
  // registries stay a surprise by default. Saved registries are always
  // someone else's, so there's no surprise to protect there.
  const [pendingInvitations, claimSummaries] = await Promise.all([
    verifiedEmails.length === 0
      ? []
      : db
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
          ),
    getClaimSummaries(db, [
      ...myRegistries.filter((r) => r.revealClaims).map((r) => r.id),
      ...savedRegistries.map((r) => r.id),
    ]),
  ]);

  const activeRegistries = myRegistries.filter((r) => !r.archivedAt);
  const archivedRegistries = myRegistries.filter((r) => r.archivedAt);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">
          My registries
        </h1>
        <Link href="/registries/new" className={buttonClasses("primary")}>
          + Create a gift registry
        </Link>
      </div>

      {pendingInvitations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Invitations</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {pendingInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
              >
                <p className="text-sm text-ink">
                  You&apos;ve been invited to co-own{" "}
                  <span className="font-semibold">
                    {invitation.registryTitle}
                  </span>
                  .
                </p>
                <div className="mt-3 flex gap-3">
                  <form action={acceptInvitation.bind(null, invitation.id)}>
                    <SubmitButton size="sm">Accept</SubmitButton>
                  </form>
                  <form action={declineInvitation.bind(null, invitation.id)}>
                    <SubmitButton variant="ghost" size="sm">
                      Decline
                    </SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {myRegistries.length === 0 ? (
        <p className="text-sm text-ink-dim">
          You don&apos;t have any registries yet.{" "}
          <Link
            href="/registries/new"
            className="text-violet hover:underline"
          >
            Create your first one
          </Link>{" "}
          — it only takes a minute.
        </p>
      ) : activeRegistries.length === 0 ? (
        <p className="text-sm text-ink-dim">
          You don&apos;t have any active registries.
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Active</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeRegistries.map((registry) => {
              const summary = claimSummaries.get(registry.id);
              return (
                <li
                  key={registry.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/registries/${registry.id}`}
                        className="font-semibold text-ink hover:text-violet"
                      >
                        {registry.title}
                      </Link>
                      {registry.eventDate && (
                        <p className="mt-0.5 text-xs text-ink-dim">
                          {formatEventDate(registry.eventDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  {summary && summary.total > 0 && (
                    <div className="mt-3">
                      <ClaimProgress
                        claimed={summary.claimed}
                        total={summary.total}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {savedRegistries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Saved registries</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {savedRegistries.map((registry) => {
              const summary = claimSummaries.get(registry.id);
              return (
                <li
                  key={registry.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/share/${registry.shareToken}`}
                      className="font-semibold text-ink hover:text-violet"
                    >
                      {registry.title}
                    </Link>
                    <form action={removeSavedRegistry.bind(null, registry.id)}>
                      <SubmitButton
                        variant="text"
                        size="sm"
                        aria-label={`Remove ${registry.title} from my registries`}
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  </div>
                  {summary && summary.total > 0 && (
                    <div className="mt-3">
                      <ClaimProgress
                        claimed={summary.claimed}
                        total={summary.total}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {archivedRegistries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Archived registries</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {archivedRegistries.map((registry) => (
              <li
                key={registry.id}
                className="rounded-2xl border border-line bg-surface p-4 opacity-60 shadow-sm"
              >
                <Link
                  href={`/registries/${registry.id}`}
                  className="font-semibold text-ink hover:text-violet"
                >
                  {registry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-ink-dim">
        Enjoying Simple Gift Registry?{" "}
        <a
          href="https://buymeacoffee.com/campbelldavis"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink hover:underline"
        >
          Buy me a coffee
        </a>{" "}
        to help cover running costs.
      </p>
    </main>
  );
}
