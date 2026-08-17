import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";
import { claimGift, unclaimGift } from "./actions";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  if (!isUuid) notFound();

  const { userId } = await auth();

  const db = getDb();
  const [registry] = await db
    .select()
    .from(registries)
    .where(eq(registries.shareToken, token));

  if (!registry) notFound();

  const registryGifts = await db
    .select()
    .from(gifts)
    .where(eq(gifts.registryId, registry.id));

  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(`/share/${token}`)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(`/share/${token}`)}`;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">{registry.title}</h1>
        {registry.eventDate && <p>Event date: {registry.eventDate}</p>}
      </div>

      <section className="flex w-full max-w-md flex-col gap-3 text-left">
        <h2 className="text-lg font-medium">Gifts</h2>
        {registryGifts.length === 0 ? (
          <p className="text-gray-500">No gifts yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {registryGifts.map((gift) => {
              const isClaimedByMe =
                !!gift.claimedAt && gift.claimedByUserId === userId;
              const isClaimedByOther = !!gift.claimedAt && !isClaimedByMe;

              return (
                <li key={gift.id} className="rounded border p-3">
                  <p className="font-medium">{gift.name}</p>
                  <p className="text-sm text-gray-500">
                    Quantity: {gift.quantity}
                  </p>
                  {gift.notes && (
                    <p className="text-sm text-gray-500">{gift.notes}</p>
                  )}

                  {isClaimedByMe && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Claimed by you</p>
                      <form action={unclaimGift.bind(null, token, gift.id)}>
                        <button
                          type="submit"
                          aria-label={`Unclaim ${gift.name}`}
                          className="text-sm underline"
                        >
                          Unclaim
                        </button>
                      </form>
                    </div>
                  )}

                  {isClaimedByOther && (
                    <p className="mt-2 text-sm text-gray-500">Claimed</p>
                  )}

                  {!gift.claimedAt && userId && (
                    <form
                      action={claimGift.bind(null, token, gift.id)}
                      className="mt-2"
                    >
                      <button
                        type="submit"
                        aria-label={`Claim ${gift.name}`}
                        className="rounded bg-black px-3 py-2 text-sm text-white"
                      >
                        Claim
                      </button>
                    </form>
                  )}

                  {!gift.claimedAt && !userId && (
                    <p className="mt-2 text-sm text-gray-500">
                      <Link href={signInUrl} className="underline">
                        Sign in
                      </Link>{" "}
                      or{" "}
                      <Link href={signUpUrl} className="underline">
                        create an account
                      </Link>{" "}
                      to claim this gift.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
