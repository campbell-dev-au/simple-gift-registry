import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";

const { When, Then, Before, After } = createBdd(test);

const NEW_FIRST_NAME = "Jamie";
const NEW_LAST_NAME = "Rivera";

Before("@account-settings", async ({ account }) => {
  await createTestAccount(account);
});

After("@account-settings", async ({ account }) => {
  await deleteTestAccount(account);
});

When("I visit my account settings", async ({ page }) => {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("link", { name: "Account settings" }).click();
});

When("I update my name", async ({ page }) => {
  await page.getByLabel("First name").fill(NEW_FIRST_NAME);
  await page.getByLabel("Last name").fill(NEW_LAST_NAME);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
});

Then("I see my updated name in the account menu", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Account menu" })).toContainText(
    `${NEW_FIRST_NAME} ${NEW_LAST_NAME}`,
  );
});
