import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries } from "@/db/schema";
import { canManageRegistry } from "@/lib/registry-access";
import { updateRegistry } from "../actions";

export default async function EditRegistryPage({
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
  if (!(await canManageRegistry(db, registry.ownerId, registry.id, userId ?? null))) {
    redirect(`/registries/${id}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Edit registry</h1>
      <form
        action={updateRegistry.bind(null, registry.id)}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <label htmlFor="title" className="text-sm font-medium">
          Registry title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={registry.title}
          className="rounded border px-3 py-2"
        />

        <label htmlFor="eventDate" className="text-sm font-medium">
          Event date (optional)
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          defaultValue={registry.eventDate ?? undefined}
          className="rounded border px-3 py-2"
        />

        <button type="submit" className="rounded bg-black py-2 text-white">
          Save changes
        </button>
      </form>
    </main>
  );
}
