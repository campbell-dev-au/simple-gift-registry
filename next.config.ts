import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Lets the Playwright webServer run its own dev server in parallel with a
  // manually-running one — Next's dev-server lockfile lives under distDir,
  // so a distinct distDir (set via NEXT_DIST_DIR in playwright.config.ts)
  // avoids the "Another next dev server is already running" collision.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  // Baseline security headers. No Content-Security-Policy yet: a useful one
  // needs per-request nonces threaded through the proxy plus an allowlist
  // for Clerk's production domain, which is worth doing as its own change
  // rather than shipping a policy loose enough to be decorative.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
      {
        // Belt-and-braces with the share page's noindex metadata — this
        // also covers any non-HTML responses under /share.
        source: "/share/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

// Sentry is inert until its env vars exist (provisioned by the Vercel
// Sentry integration): without SENTRY_AUTH_TOKEN the build skips source-map
// upload, and without a DSN the runtime inits are no-ops.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
