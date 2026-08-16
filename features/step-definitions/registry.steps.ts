import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";
import { deleteTestRegistry } from "./registry-test-data";

const { Given, When, Then, Before, After } = createBdd(test);

Before("@registry", async ({ account }) => {
  await createTestAccount(account);
});

After("@registry", async ({ account, registry }) => {
  await deleteTestAccount(account);
  if (registry.id) {
    await deleteTestRegistry(registry.id);
  }
});

When("I choose to create a gift registry", async ({ page }) => {
  await page.getByRole("link", { name: "Create a gift registry" }).click();
});

When("I submit a title for my registry", async ({ page }) => {
  await page.getByLabel("Registry title").fill("Our Wedding Registry");
  await page.getByRole("button", { name: "Create registry" }).click();
});

Then("I see my new registry's title", async ({ page, registry }) => {
  await expect(
    page.getByRole("heading", { name: "Our Wedding Registry" }),
  ).toBeVisible();

  const match = page.url().match(/\/registries\/([0-9a-f-]{36})/i);
  if (match) registry.id = match[1];
});

Given("I have not signed in", async ({ page }) => {
  await page.goto("/");
});

When("I try to visit the create-registry page directly", async ({ page }) => {
  await page.goto("/registries/new");
});

Then("I am redirected to sign in", async ({ page }) => {
  await expect(page).toHaveURL("/sign-in");
});
