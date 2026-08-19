import * as Sentry from "@sentry/nextjs";

// No-op until the Vercel Sentry integration provisions a DSN.
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
