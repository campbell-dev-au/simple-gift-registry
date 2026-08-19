import Link from "next/link";

// Shown for a share token that doesn't resolve — most often a link that
// was invalidated by "Get a new share link". Guests arriving here did
// nothing wrong, so explain the likely cause instead of a bare 404.
export default function ShareNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">
        This share link isn&apos;t working
      </h1>
      <p className="max-w-sm text-sm text-ink-dim">
        The registry may have moved to a new link. Ask whoever sent it to
        you for their latest one.
      </p>
      <Link href="/" className="text-sm text-violet hover:underline">
        Go to Simple Gift Registry
      </Link>
    </main>
  );
}
