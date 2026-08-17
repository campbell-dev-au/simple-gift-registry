import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { saveTestRegistry } from "./registry-test-data";

const { Given, When, Then } = createBdd(test);

// Matches the title "someone has a gift registry" (share.steps.ts) creates.
const SAVED_REGISTRY_TITLE = "Someone's Registry";

Given("I have saved the registry", async ({ account, registry }) => {
  await saveTestRegistry(registry.id, account.userId);
});

When("I save the registry", async ({ page }) => {
  await page.getByRole("button", { name: "Save to my registries" }).click();
});

Then("I see the registry marked as saved", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Remove from my registries" }),
  ).toBeVisible();
});

When(
  "I remove the registry from my saved registries",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "Remove from my registries" })
      .click();
  },
);

When("I remove the saved registry", async ({ page }) => {
  await page
    .getByRole("button", {
      name: `Remove ${SAVED_REGISTRY_TITLE} from my registries`,
    })
    .click();
});

Then(
  "I see the registry in my saved registries list",
  async ({ page }) => {
    await page.goto("/registries");
    await expect(
      page.getByRole("link", { name: SAVED_REGISTRY_TITLE }),
    ).toBeVisible();
  },
);

Then(
  "I do not see the registry in my saved registries list",
  async ({ page }) => {
    await page.goto("/registries");
    await expect(
      page.getByRole("link", { name: SAVED_REGISTRY_TITLE }),
    ).toHaveCount(0);
  },
);

Then("I am prompted to sign in to save the registry", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: "Sign in to save this registry" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save to my registries" }),
  ).toHaveCount(0);
});

Then("I do not see a way to save the registry", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Save to my registries" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Remove from my registries" }),
  ).toHaveCount(0);
});
