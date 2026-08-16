import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";
import { addGift, deleteGift, archiveRegistry, unarchiveRegistry } from "./actions";

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

  const isOwner = userId === registry.ownerId;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">{registry.title}</h1>
        {registry.eventDate && <p>Event date: {registry.eventDate}</p>}
        {registry.archivedAt && (
          <p className="text-sm text-gray-500">Archived</p>
        )}
        {isOwner && (
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
                {isOwner && (
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

      {isOwner && (
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
