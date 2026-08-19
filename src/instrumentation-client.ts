import * as Sentry from "@sentry/nextjs";

// No-op until the Vercel Sentry integration provisions a DSN.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
