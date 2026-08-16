import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";
import { deleteTestRegistry } from "./registry-test-data";

const { Given, When, Then, Before, After } = createBdd(test);

Before("@registry", async ({ account }) => {
  await createTestAccount(account);
});

After("@registry", async ({ account, registry, otherRegistry }) => {
  await deleteTestAccount(account);
  if (registry.id) {
    await deleteTestRegistry(registry.id);
  }
  if (otherRegistry.id) {
    await deleteTestRegistry(otherRegistry.id);
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

When("I edit the registry's title", async ({ page, registry }) => {
  await page.goto(`/registries/${registry.id}`);
  await page.getByRole("link", { name: "Edit registry" }).click();
  // Wait for the client-side navigation to actually land before filling —
  // see the equivalent gift-edit step for why this matters.
  await page.getByRole("heading", { name: "Edit registry" }).waitFor();
  await page.getByLabel("Registry title").fill("Our Updated Wedding Registry");
  await page.getByRole("button", { name: "Save changes" }).click();
});

Then("I see the updated title on the registry page", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Our Updated Wedding Registry" }),
  ).toBeVisible();
});

Then("I do not see a way to edit the registry", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Edit registry" }),
  ).toHaveCount(0);
});

When("I view my registries", async ({ page }) => {
  await page.goto("/registries");
});

Then("I see my registry in the list", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Our Wedding Registry" }),
  ).toBeVisible();
});

Then("I do not see the other registry in the list", async ({ page }) => {
  await expect(page.getByText("Someone Else's Registry")).toHaveCount(0);
});

Then("I see a message that I have no registries yet", async ({ page }) => {
  await expect(
    page.getByText("You don't have any registries yet."),
  ).toBeVisible();
});
