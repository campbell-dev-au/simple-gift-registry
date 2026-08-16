import { expect } from "@playwright/test";
import { createBdd, test } from "playwright-bdd";

const { Given, Then } = createBdd(test);

Given("I visit the homepage", async ({ page }) => {
  await page.goto("/");
});

Then("I see a heading that says {string}", async ({ page }, text: string) => {
  await expect(page.getByRole("heading", { name: text })).toBeVisible();
});
