import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";
import {
  createTestRegistry,
  deleteTestRegistry,
  claimTestGift,
} from "./registry-test-data";

const { Given, When, Then, Before, After } = createBdd(test);

// Matches the name "the registry has a gift" (gift.steps.ts) creates.
const GUEST_GIFT_NAME = "Kettle";

// Claiming now requires a real Clerk account (see docs/stories/claim-gift.md
// for why anonymous claiming was replaced), so @share scenarios need the
// same account setup as @registry ones — it's no longer meaningfully
// cheaper, just a different grouping (guest-perspective vs owner-management
// scenarios).
Before("@share", async ({ account }) => {
  await createTestAccount(account);
});

After("@share", async ({ account, registry }) => {
  await deleteTestAccount(account);
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

Given("the gift has been claimed by someone else", async ({ registry }) => {
  await claimTestGift(
    registry.id,
    GUEST_GIFT_NAME,
    "user_someone_else_claimed_this",
  );
});

Given("I have claimed the gift", async ({ account, registry }) => {
  await claimTestGift(registry.id, GUEST_GIFT_NAME, account.userId);
});

When("I open the registry's share link", async ({ page, registry }) => {
  await page.goto(`/share/${registry.shareToken}`);
});

When("I claim the gift", async ({ page }) => {
  await page
    .getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}` })
    .click();
});

Then("I see the gift marked as claimed by me", async ({ page }) => {
  await expect(page.getByText("Claimed by you")).toBeVisible();
});

Then("I see the gift is claimed", async ({ page }) => {
  await expect(page.getByText("Claimed", { exact: true })).toBeVisible();
});

Then("I do not see who claimed it", async ({ page }) => {
  await expect(page.getByText("Claimed by you")).toHaveCount(0);
});

Then("I do not see a way to unclaim it", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: `Unclaim ${GUEST_GIFT_NAME}` }),
  ).toHaveCount(0);
});

When("I unclaim the gift", async ({ page }) => {
  await page
    .getByRole("button", { name: `Unclaim ${GUEST_GIFT_NAME}` })
    .click();
});

Then("I see the gift is available to claim again", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}` }),
  ).toBeVisible();
});

Then("I am prompted to sign in to claim the gift", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}` }),
  ).toHaveCount(0);
});
