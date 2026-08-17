import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonClasses } from "@/components/button";
import { IconGift } from "@/components/icons";

export default async function Home() {
  // A signed-in visitor has nothing to do on this welcome page that isn't
  // already one click away in the header — send them straight to their
  // registries instead of an extra "Welcome back" stop.
  const { userId } = await auth();
  if (userId) redirect("/registries");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet/10 text-violet">
        <IconGift className="h-6 w-6" />
      </span>
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">
          Simple Gift Registry
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-dim">
          Build a registry, share one link, and let guests claim gifts
          without doubling up.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/sign-up" className={buttonClasses("primary")}>
          Create account
        </Link>
        <Link href="/sign-in" className={buttonClasses("ghost")}>
          Sign in
        </Link>
      </div>
    </main>
  );
}
