import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries, gifts } from "@/db/schema";
import { updateGift } from "../../../actions";

export default async function EditGiftPage({
  params,
}: {
  params: Promise<{ id: string; giftId: string }>;
}) {
  const { id, giftId } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!isUuid.test(id) || !isUuid.test(giftId)) notFound();

  const { userId } = await auth();

  const [registry] = await getDb()
    .select()
    .from(registries)
    .where(eq(registries.id, id));

  if (!registry) notFound();
  if (userId !== registry.ownerId) redirect(`/registries/${id}`);

  const [gift] = await getDb()
    .select()
    .from(gifts)
    .where(eq(gifts.id, giftId));

  if (!gift || gift.registryId !== id) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Edit gift</h1>
      <form
        action={updateGift.bind(null, registry.id, gift.id)}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <label htmlFor="name" className="text-sm font-medium">
          Gift name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={gift.name}
          className="rounded border px-3 py-2"
        />

        <label htmlFor="notes" className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={gift.notes ?? undefined}
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
          defaultValue={gift.quantity}
          className="rounded border px-3 py-2"
        />

        <button type="submit" className="rounded bg-black py-2 text-white">
          Save changes
        </button>
      </form>
    </main>
  );
}
