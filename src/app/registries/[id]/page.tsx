import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { registries } from "@/db/schema";

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const [registry] = await getDb()
    .select()
    .from(registries)
    .where(eq(registries.id, id));

  if (!registry) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{registry.title}</h1>
      {registry.eventDate && <p>Event date: {registry.eventDate}</p>}
    </main>
  );
}
