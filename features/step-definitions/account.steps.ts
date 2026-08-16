import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { test } from "./fixtures";

const { Given, When, Then, Before } = createBdd(test);

Before("@auth", async ({ page }) => {
  await setupClerkTestingToken({ page });
});

Given("I am on the homepage", async ({ page }) => {
  await page.goto("/");
});

When("I choose to create an account", async ({ page }) => {
  await page.getByRole("link", { name: "Create account" }).click();
});

When(
  "I sign up with a new email address and a valid password",
  async ({ page, account }) => {
    // The +clerk_test subaddress and 424242 code make sign-up deterministic —
    // no real email is sent. https://clerk.com/docs/testing/test-emails-and-phones
    account.email = `gift-registry-test-${Date.now()}+clerk_test@example.com`;

    await page.getByLabel("Email address").fill(account.email);
    await page.getByLabel("Password").fill("Correct-Horse-Battery-Staple-1!");
    await page.getByRole("button", { name: "Continue" }).click();
  },
);

When("I enter the emailed verification code", async ({ page }) => {
  const codeInput = page.getByLabel("Verification code");
  await codeInput.fill("424242");
  await expect(codeInput).toHaveValue("424242");
  await page.getByRole("button", { name: "Verify" }).click();
});

Then("I am signed in", async ({ page }) => {
  await expect(page).toHaveURL("/");
  await expect(page.getByText("Signed in as")).toBeVisible();
});

Then("I see my email address on the homepage", async ({ page, account }) => {
  await expect(page.getByText(account.email)).toBeVisible();
});
