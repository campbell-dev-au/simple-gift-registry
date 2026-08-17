import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { IconGift } from "@/components/icons";
import { SignOutButton } from "@/app/sign-out-button";

export async function SiteHeader() {
  // auth() reads session claims already on the request — unlike
  // currentUser(), it doesn't make a Clerk API call, and this header
  // renders on every page, so that difference matters. Only the
  // signed-in/out boolean is needed here; the account email itself is
  // shown once, on the home page after signing in.
  const { userId } = await auth();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-base font-bold text-ink"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet/10 text-violet">
            <IconGift className="h-4 w-4" />
          </span>
          Gift Registry
        </Link>

        {userId ? (
          <SignOutButton />
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-violet hover:underline">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm font-medium text-violet hover:underline">
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
