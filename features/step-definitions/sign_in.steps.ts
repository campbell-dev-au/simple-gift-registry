import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { createClerkClient } from "@clerk/backend";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test } from "./fixtures";

const { Given, When, Before, After } = createBdd(test);

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

Before("@sign-in", async ({ page }) => {
  await setupClerkTestingToken({ page });
});

Before("@sign-in", async ({ account }) => {
  // Seed the account directly via the Backend API instead of the sign-up UI —
  // keeps this scenario independent of, and faster than, the sign-up flow.
  account.email = `gift-registry-test-${Date.now()}+clerk_test@example.com`;
  account.password = "Correct-Horse-Battery-Staple-1!";

  const user = await clerkClient.users.createUser({
    emailAddress: [account.email],
    password: account.password,
  });
  account.userId = user.id;
});

After("@sign-in", async ({ account }) => {
  if (account.userId) {
    await clerkClient.users.deleteUser(account.userId);
  }
});

Given("I have an existing account", async () => {
  // No-op: account creation happens in the Before hook above so it's ready
  // before any step runs, including the "I am on the homepage" step.
});

When("I choose to sign in", async ({ page }) => {
  await page.getByRole("link", { name: "Sign in" }).click();
});

When("I sign in with my email address and password", async ({ page, account }) => {
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Continue" }).click();
});

When("I verify this device with the emailed code", async ({ page }) => {
  // A browser Clerk hasn't seen before is untrusted by default, so sign-in
  // requires a one-time email code even without MFA enabled.
  const codeInput = page.getByLabel("Verification code");
  await codeInput.fill("424242");
  await expect(codeInput).toHaveValue("424242");
  await page.getByRole("button", { name: "Verify" }).click();
});
