import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestRegistry, createTestGift } from "./registry-test-data";

const { Given, When, Then } = createBdd(test);

// Fixed name for the edit/remove scenarios below — a single gift per
// scenario's registry, so matching by name (rather than tracking an id
// fixture) is enough to disambiguate its Edit/Remove controls.
const EXISTING_GIFT_NAME = "Kettle";

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

Given("someone else owns a gift registry", async ({ otherRegistry }) => {
  otherRegistry.id = await createTestRegistry(
    "user_someone_else_not_the_signed_in_user",
    "Someone Else's Registry",
  );
});

When("I visit their registry", async ({ page, otherRegistry }) => {
  await page.goto(`/registries/${otherRegistry.id}`);
});

Then("I do not see a way to add a gift", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Add a gift" })).toHaveCount(
    0,
  );
});

Given("the registry has a gift", async ({ registry }) => {
  await createTestGift(registry.id, EXISTING_GIFT_NAME);
});

Given("their registry has a gift", async ({ otherRegistry }) => {
  await createTestGift(otherRegistry.id, EXISTING_GIFT_NAME);
});

When("I edit the gift's details", async ({ page, registry }) => {
  await page.goto(`/registries/${registry.id}`);
  await page
    .getByRole("link", { name: `Edit ${EXISTING_GIFT_NAME}` })
    .click();
  // The registry page's own "Add a gift" form has a same-named "Gift name"
  // field — wait for the client-side navigation to actually land on the
  // edit page before filling, or these fills can hit the stale pre-nav DOM.
  await page.getByRole("heading", { name: "Edit gift" }).waitFor();
  await page.getByLabel("Gift name").fill("Electric Kettle");
  await page.getByLabel("Notes (optional)").fill("Matte black please");
  await page.getByLabel("Quantity").fill("3");
  await page.getByRole("button", { name: "Save changes" }).click();
});

Then(
  "I see the updated gift details in the registry's gift list",
  async ({ page }) => {
    await expect(page.getByText("Electric Kettle")).toBeVisible();
    await expect(page.getByText("Matte black please")).toBeVisible();
    await expect(page.getByText("Quantity: 3")).toBeVisible();
  },
);

When("I remove the gift", async ({ page, registry }) => {
  await page.goto(`/registries/${registry.id}`);
  await page
    .getByRole("button", { name: `Remove ${EXISTING_GIFT_NAME}` })
    .click();
});

Then(
  "I no longer see the gift in the registry's gift list",
  async ({ page }) => {
    await expect(
      page.getByText(EXISTING_GIFT_NAME, { exact: true }),
    ).toHaveCount(0);
  },
);

Then("I do not see a way to edit or remove that gift", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: `Edit ${EXISTING_GIFT_NAME}` }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `Remove ${EXISTING_GIFT_NAME}` }),
  ).toHaveCount(0);
});
