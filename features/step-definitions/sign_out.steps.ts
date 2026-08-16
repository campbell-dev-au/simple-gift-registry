import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { clerk } from "@clerk/testing/playwright";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";

const { Given, When, Then, Before, After } = createBdd(test);

Before("@sign-out", async ({ account }) => {
  await createTestAccount(account);
});

After("@sign-out", async ({ account }) => {
  await deleteTestAccount(account);
});

Given("I am already signed in", async ({ page, account }) => {
  // Arranges the signed-in precondition directly via Clerk's testing helper
  // (bypasses the sign-in UI, including the device-trust step) — this
  // scenario is about sign-out, so sign-in itself is arranged, not exercised.
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: account.email });
  await page.goto("/");
});

When("I choose to sign out", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
});

Then("I am signed out", async ({ page }) => {
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
