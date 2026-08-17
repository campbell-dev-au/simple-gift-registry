import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { buttonClasses } from "@/components/button";
import { IconGift } from "@/components/icons";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
          <IconGift className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-ink-dim">
            Signed in as {user.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/registries/new" className={buttonClasses("primary")}>
            + Create a gift registry
          </Link>
          <Link href="/registries" className={buttonClasses("ghost")}>
            My registries
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
        <IconGift className="h-6 w-6" />
      </span>
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">
          Gift Registry
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-dim">
          Build a registry, share one link, and let guests claim gifts
          without doubling up.
        </p>
      </div>
    </main>
  );
}
