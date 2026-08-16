import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestRegistry } from "./registry-test-data";

const { Given, When, Then } = createBdd(test);

Given("I have created a gift registry", async ({ account, registry }) => {
  registry.id = await createTestRegistry(account.userId, "Our Wedding Registry");
});

When(
  "I add a gift with a name, notes, and a quantity",
  async ({ page, registry }) => {
    await page.goto(`/registries/${registry.id}`);
    await page.getByLabel("Gift name").fill("Espresso Machine");
    await page.getByLabel("Notes (optional)").fill("Any brand is fine!");
    await page.getByLabel("Quantity").fill("2");
    await page.getByRole("button", { name: "Add gift" }).click();
  },
);

Then(
  "I see the gift with that quantity in my registry's gift list",
  async ({ page }) => {
    await expect(page.getByText("Espresso Machine")).toBeVisible();
    await expect(page.getByText("Any brand is fine!")).toBeVisible();
    await expect(page.getByText("Quantity: 2")).toBeVisible();
  },
);

When(
  "I add a gift without specifying a quantity",
  async ({ page, registry }) => {
    await page.goto(`/registries/${registry.id}`);
    await page.getByLabel("Gift name").fill("Blender");
    await page.getByRole("button", { name: "Add gift" }).click();
  },
);

Then(
  "I see the gift with a quantity of one in my registry's gift list",
  async ({ page }) => {
    await expect(page.getByText("Blender")).toBeVisible();
    await expect(page.getByText("Quantity: 1")).toBeVisible();
  },
);

Given("someone else owns a gift registry", async ({ registry }) => {
  registry.id = await createTestRegistry(
    "user_someone_else_not_the_signed_in_user",
    "Someone Else's Registry",
  );
});

When("I visit their registry", async ({ page, registry }) => {
  await page.goto(`/registries/${registry.id}`);
});

Then("I do not see a way to add a gift", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Add a gift" })).toHaveCount(
    0,
  );
});
