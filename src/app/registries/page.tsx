import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { registries } from "@/db/schema";

export default async function RegistriesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const myRegistries = await getDb()
    .select()
    .from(registries)
    .where(eq(registries.ownerId, userId));

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">My registries</h1>

      {myRegistries.length === 0 ? (
        <p className="text-gray-500">You don&apos;t have any registries yet.</p>
      ) : (
        <ul className="flex w-full max-w-md flex-col gap-2 text-left">
          {myRegistries.map((registry) => (
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
    </main>
  );
}
