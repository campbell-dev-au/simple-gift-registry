import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestAccount, deleteTestAccount } from "./clerk-test-account";
import {
  createTestRegistry,
  deleteTestRegistry,
  claimTestGift,
} from "./registry-test-data";
import { MULTI_QTY_GIFT_NAME } from "./gift.steps";

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
  // Scoped to a listitem: the page also has a "Claimed" section heading once
  // any gift is fully claimed, which collides with the exact-text match on
  // the gift's own status pill.
  await expect(
    page.getByRole("listitem").getByText("Claimed", { exact: true }),
  ).toBeVisible();
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
  // exact is load-bearing: getByRole matches accessible names by substring,
  // so a non-exact "Claim Kettle" also matches the "Unclaim Kettle" button
  // and this would pass even if the unclaim never took effect.
  await expect(
    page.getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}`, exact: true }),
  ).toBeVisible();
});

Then("I am prompted to sign in to claim the gift", async ({ page }) => {
  // Scoped to "...to claim this gift" rather than a bare "Sign in" link —
  // the page can also show a "Sign in to save this registry" link (see
  // save_registry.feature), and a plain "Sign in" query would match both.
  await expect(page.getByText("to claim this gift")).toBeVisible();
  await expect(
    page.getByRole("button", { name: `Claim ${GUEST_GIFT_NAME}` }),
  ).toHaveCount(0);
});

Given(
  "{int} of the gift have been claimed by someone else",
  async ({ registry }, quantity: number) => {
    await claimTestGift(
      registry.id,
      MULTI_QTY_GIFT_NAME,
      "user_someone_else_claimed_this",
      quantity,
    );
  },
);

When("I claim {int} of the gift", async ({ page }, quantity: number) => {
  await page.getByLabel("Quantity to claim").fill(String(quantity));
  await page
    .getByRole("button", { name: `Claim ${MULTI_QTY_GIFT_NAME}` })
    .click();
});

Then(
  "I see the gift marked as claimed by me for {int}",
  async ({ page }, quantity: number) => {
    await expect(
      page.getByText(`Claimed by you (${quantity})`),
    ).toBeVisible();
  },
);

Then("I see {int} remaining", async ({ page }, quantity: number) => {
  await expect(
    page.getByText(`${quantity} remaining`, { exact: true }),
  ).toBeVisible();
});

Then("the most I can claim is {int}", async ({ page }, quantity: number) => {
  await expect(page.getByLabel("Quantity to claim")).toHaveAttribute(
    "max",
    String(quantity),
  );
});
