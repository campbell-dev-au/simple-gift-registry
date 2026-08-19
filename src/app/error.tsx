"use client";

import { buttonClasses } from "@/components/button";

// Route error boundary — server actions and pages that throw (bad input,
// a lost race, a flaky upstream) land here instead of a blank framework
// error screen. The header/footer layout stays mounted around it.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-ink-dim">
        That didn&apos;t save. Your registries are safe — try again, and if
        it keeps happening, reload the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className={buttonClasses("primary")}
      >
        Try again
      </button>
    </main>
  );
}
