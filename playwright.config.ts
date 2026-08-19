import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

dotenv.config({ path: ".env.local", quiet: true });
// @clerk/testing reads CLERK_PUBLISHABLE_KEY; Next.js env vars are prefixed NEXT_PUBLIC_.
process.env.CLERK_PUBLISHABLE_KEY ??= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: "features/step-definitions/**/*.ts",
});

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  // Scenarios call Clerk's real hosted API rather than a mock, so allow more
  // headroom than Playwright's 5s default for occasional network latency.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    // For the copy-share-password scenario: lets the app's clipboard write
    // succeed headlessly and the test read it back to assert the value.
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "global setup",
      testDir: "playwright",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      testDir,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["global setup"],
    },
  ],
  webServer: {
    // CI serves the production build from the preceding `next build` step —
    // faster than dev-mode on-demand compilation, and it tests the artifact
    // that actually deploys. Locally a dev server picks up uncommitted
    // changes without a rebuild.
    command: process.env.CI
      ? "npm run start -- -p 3100"
      : "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    // Locally, a distinct distDir (see next.config.ts) so this dev server
    // doesn't collide, via Next's dev-server lockfile, with one already
    // running manually (e.g. on port 3002) for the same project. In CI,
    // inherit process.env unchanged so `next start` uses the distDir the
    // build step produced.
    env: process.env.CI
      ? undefined
      : { ...process.env, NEXT_DIST_DIR: ".next-test" },
  },
});
