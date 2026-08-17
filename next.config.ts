import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the Playwright webServer run its own dev server in parallel with a
  // manually-running one — Next's dev-server lockfile lives under distDir,
  // so a distinct distDir (set via NEXT_DIST_DIR in playwright.config.ts)
  // avoids the "Another next dev server is already running" collision.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
