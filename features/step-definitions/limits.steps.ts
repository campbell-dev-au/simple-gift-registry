import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import {
  createManyTestRegistries,
  fillTestInvitations,
} from "./registry-test-data";
import {
  REGISTRY_COUNT_MAX,
  INVITE_COUNT_MAX,
} from "../../src/lib/field-limits";

const { Given, When, Then } = createBdd(test);

Given(
  "I already own the maximum number of registries",
  async ({ account }) => {
    await createManyTestRegistries(account.userId, REGISTRY_COUNT_MAX);
  },
);

Then("I see that I have reached the registry limit", async ({ page }) => {
  await expect(
    page.getByText(
      `You've reached the limit of ${REGISTRY_COUNT_MAX} registries`,
    ),
  ).toBeVisible();
});

Given(
  "the registry already has the maximum number of invitations",
  async ({ registry }) => {
    await fillTestInvitations(registry.id, INVITE_COUNT_MAX);
  },
);

Then(
  "I see that the registry cannot have more co-owners",
  async ({ page }) => {
    await expect(
      page.getByText(
        `A registry can have at most ${INVITE_COUNT_MAX} co-owners and pending invitations.`,
      ),
    ).toBeVisible();
  },
);

When(
  "I try to open the other registry's management page",
  async ({ page, otherRegistry }) => {
    await page.goto(`/registries/${otherRegistry.id}`);
  },
);

Then("I see that the page does not exist", async ({ page }) => {
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});
