import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { setTestRegistryPassword } from "./registry-test-data";

const { Given, When, Then } = createBdd(test);

// Matches the name "the registry has a gift" (gift.steps.ts) creates.
const GUEST_GIFT_NAME = "Kettle";

Given(
  "the registry is protected with the password {string}",
  async ({ registry }, password: string) => {
    await setTestRegistryPassword(registry.id, password);
  },
);

When("I set the share password {string}", async ({ page }, password: string) => {
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Set password" }).click();
});

Then("I see that guests now need a password", async ({ page }) => {
  await expect(
    page.getByText("Guests need a password to open the share link."),
  ).toBeVisible();
});

Then("I am asked for the registry password", async ({ page }) => {
  await expect(
    page.getByText("This registry is password protected"),
  ).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

Then("I am not asked for the registry password", async ({ page }) => {
  // The owner's registry in these scenarios has no gifts, so the unlocked
  // share page is recognisable by its empty state — waiting on that first
  // stops the negative assertion below from passing vacuously against a
  // page that hasn't streamed in yet.
  await expect(page.getByText("No gifts yet.")).toBeVisible();
  await expect(page.getByText("This registry is password protected")).toHaveCount(0);
});

When(
  "I enter the registry password {string}",
  async ({ page }, password: string) => {
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "View registry" }).click();
  },
);

Then("I see the gift", async ({ page }) => {
  await expect(page.getByText(GUEST_GIFT_NAME)).toBeVisible();
});

Then("I do not see the gift", async ({ page }) => {
  await expect(page.getByText(GUEST_GIFT_NAME)).toHaveCount(0);
});

Then("I see that the password is not right", async ({ page }) => {
  await expect(page.getByText("That password isn't right")).toBeVisible();
});

When("I remove the share password", async ({ page }) => {
  // Removing asks for confirmation (window.confirm); Playwright dismisses
  // dialogs by default, which would cancel the removal.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove password" }).click();
});

Then("I see that a password can be set again", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Set password" })).toBeVisible();
});
