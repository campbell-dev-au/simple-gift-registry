import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";

const { Given, When, Before, After } = createBdd(test);

Before("@sign-in", async ({ page, account }) => {
  await setupClerkTestingToken({ page });
  await createTestAccount(account);
});

After("@sign-in", async ({ account }) => {
  await deleteTestAccount(account);
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
