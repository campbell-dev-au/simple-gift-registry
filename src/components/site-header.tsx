import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { IconGift } from "@/components/icons";
import { AccountMenu } from "@/components/account-menu";

export async function SiteHeader() {
  // auth() reads session claims already on the request — unlike
  // currentUser(), it doesn't make a Clerk API call, and this header
  // renders on every page, so that difference matters. AccountMenu gets
  // the visitor's name/email itself, client-side via useUser() — that
  // reads Clerk's already-loaded session instead of another server call.
  // (An earlier version used currentUser() here and measurably hammered
  // Clerk's dev-tier rate limit across a page-heavy test run.)
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
          Simple Gift Registry
        </Link>

        {userId ? (
          <AccountMenu />
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
