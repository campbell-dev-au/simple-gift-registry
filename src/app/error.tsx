"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { buttonClasses } from "@/components/button";

// Route error boundary — pages and actions that throw unexpectedly (a
// flaky upstream, a genuine bug) land here instead of a blank framework
// error screen; expected failures (validation, caps, lost claim races)
// never do — they come back as typed results shown inline by their forms.
// The header/footer layout stays mounted around it.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-ink-dim">
        Your registries are safe — try again, and if it keeps happening,
        reload the page.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className={buttonClasses("primary")}
      >
        Try again
      </button>
      {error.digest && (
        <p className="text-xs text-ink-dim">Error reference: {error.digest}</p>
      )}
    </main>
  );
}
