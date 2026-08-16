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
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
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
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
  },
});
