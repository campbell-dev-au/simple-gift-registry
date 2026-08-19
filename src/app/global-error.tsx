"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Last-resort boundary for errors thrown in the root layout itself, where
// error.tsx can't render. It replaces the whole document, so it must
// provide its own <html>/<body> and can't rely on the app's CSS.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1>Something went wrong</h1>
          <p>Reload the page to keep going. Your registries are safe.</p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#666" }}>
              Error reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
