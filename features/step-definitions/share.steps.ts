import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import {
  createTestRegistry,
  deleteTestRegistry,
  claimTestGift,
} from "./registry-test-data";

const { Given, When, Then, After } = createBdd(test);

// Matches the name "the registry has a gift" (gift.steps.ts) creates.
const GUEST_GIFT_NAME = "Kettle";
const GUEST_CLAIMANT_NAME = "Jane Guest";

// No Clerk account needed here — guests never sign in, and the "owner" is
// just a synthetic id (same approach as "someone else owns a gift
// registry"), since these scenarios never authenticate as them either.
After("@share", async ({ registry }) => {
  if (registry.id) {
    await deleteTestRegistry(registry.id);
  }
});

Given("someone has a gift registry", async ({ registry }) => {
  const created = await createTestRegistry(
    "user_registry_owner_not_signed_in",
    "Someone's Registry",
  );
  registry.id = created.id;
  registry.shareToken = created.shareToken;
});

Given("the gift has been claimed", async ({ registry }) => {
  await claimTestGift(registry.id, GUEST_GIFT_NAME, "Previously Claimed");
});

When("I open the registry's share link", async ({ page, registry }) => {
  await page.goto(`/share/${registry.shareToken}`);
});

When("I claim the gift with my name", async ({ page }) => {
  await page
    .getByLabel(`Your name (claiming ${GUEST_GIFT_NAME})`)
    .fill(GUEST_CLAIMANT_NAME);
  await page.getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}` }).click();
});

Then("I see the gift marked as claimed by my name", async ({ page }) => {
  await expect(
    page.getByText(`Claimed by ${GUEST_CLAIMANT_NAME}`),
  ).toBeVisible();
});

When("I unclaim the gift", async ({ page }) => {
  await page
    .getByRole("button", { name: `Unclaim ${GUEST_GIFT_NAME}` })
    .click();
});

Then("I see the gift is available to claim again", async ({ page }) => {
  await expect(
    page.getByLabel(`Your name (claiming ${GUEST_GIFT_NAME})`),
  ).toBeVisible();
});
