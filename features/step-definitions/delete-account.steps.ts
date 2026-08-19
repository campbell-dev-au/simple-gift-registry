import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";
import { deleteTestRegistriesByOwner } from "./registry-test-data";

const { When, Then, Before, After } = createBdd(test);

Before("@account-deletion", async ({ account }) => {
  await createTestAccount(account);
});

After("@account-deletion", async ({ account }) => {
  // Owner-based sweep instead of per-id: the scenarios delete their data
  // through the UI, so `registry.id` may already be gone — and if the
  // deletion under test failed, this still cleans up whatever survived.
  if (account.userId) {
    await deleteTestRegistriesByOwner(account.userId);
  }
  try {
    await deleteTestAccount(account);
  } catch {
    // The account-deletion scenario already removed the Clerk user — the
    // 404 here is the success case, not a cleanup failure.
  }
});

When("I delete all my account data", async ({ page }) => {
  await page.goto("/account");
  // Deleting asks for confirmation (window.confirm); Playwright dismisses
  // dialogs by default, which would cancel the deletion.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete all my data" }).click();
});

Then("I see confirmation that my data was deleted", async ({ page }) => {
  await expect(
    page.getByText("All your data has been deleted."),
  ).toBeVisible();
});

When("I delete my account", async ({ page }) => {
  await page.goto("/account");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete my account" }).click();
});
