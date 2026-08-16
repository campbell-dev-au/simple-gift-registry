import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-3xl font-semibold">Gift Registry</h1>
        <p>Signed in as {user.primaryEmailAddress?.emailAddress}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Gift Registry</h1>
      <p className="text-gray-500">Bare-bones scaffold — ready to build on.</p>
      <div className="flex gap-4">
        <Link href="/sign-up" className="underline">
          Create account
        </Link>
        <Link href="/sign-in" className="underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}
