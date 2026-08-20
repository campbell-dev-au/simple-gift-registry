import * as Sentry from "@sentry/nextjs";

// No-op until the Vercel Sentry integration provisions a DSN.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    // Android WebView tears down its JS<->Java postMessage bridge when the
    // in-app browser is backgrounded/closed mid-flight (e.g. during Clerk's
    // Turnstile or Google SSO postMessage handshake). Not fixable from JS.
    "Java object is gone",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
