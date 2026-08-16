import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

// Must run serially — see https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

setup("global setup", async () => {
  await clerkSetup();
});
