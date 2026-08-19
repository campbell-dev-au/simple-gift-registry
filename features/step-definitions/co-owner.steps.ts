import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { test } from "./fixtures";
import { createTestRegistry, createTestInvitation } from "./registry-test-data";
import { createTestAccount } from "./clerk-test-account";

const { Given, When, Then } = createBdd(test);

// Title for registries owned by "someone else" in these scenarios — the
// signed-in test account only ever appears as an invitee or co-owner, never
// as the creator, so a fixed fake owner id (never actually signed into) is
// enough; matches the pattern already used for claimed-by-someone-else gifts.
const INVITING_OWNER_USER_ID = "user_registry_owner_not_signed_in";
const INVITED_REGISTRY_TITLE = "Someone's Registry";

Given(
  "someone has invited me to co-own their gift registry",
  async ({ account, registry }) => {
    const created = await createTestRegistry(
      INVITING_OWNER_USER_ID,
      INVITED_REGISTRY_TITLE,
    );
    registry.id = created.id;
    registry.shareToken = created.shareToken;

    await createTestInvitation(registry.id, account.email, {
      invitedByUserId: INVITING_OWNER_USER_ID,
    });
  },
);

Given(
  "I am a co-owner of someone else's gift registry",
  async ({ account, registry }) => {
    const created = await createTestRegistry(
      INVITING_OWNER_USER_ID,
      INVITED_REGISTRY_TITLE,
    );
    registry.id = created.id;
    registry.shareToken = created.shareToken;

    await createTestInvitation(registry.id, account.email, {
      invitedByUserId: INVITING_OWNER_USER_ID,
      status: "accepted",
      acceptedByUserId: account.userId,
    });
  },
);

Given(
  "I have invited {string} as a co-owner",
  async ({ account, registry }, email: string) => {
    await createTestInvitation(registry.id, email, {
      invitedByUserId: account.userId,
    });
  },
);

const REMOVABLE_CO_OWNER_USER_ID = "user_removable_co_owner_not_signed_in";
const REMOVABLE_CO_OWNER_EMAIL = "coowner@example.com";

Given(
  "another person has accepted my co-owner invitation",
  async ({ account, registry }) => {
    await createTestInvitation(registry.id, REMOVABLE_CO_OWNER_EMAIL, {
      invitedByUserId: account.userId,
      status: "accepted",
      acceptedByUserId: REMOVABLE_CO_OWNER_USER_ID,
    });
  },
);

When("I invite {string} as a co-owner", async ({ page }, email: string) => {
  await page.getByLabel("Invite a co-owner").fill(email);
  await page.getByRole("button", { name: "Invite" }).click();
});

Then(
  "I see {string} listed as a pending invitation",
  async ({ page }, email: string) => {
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  },
);

When(
  "I cancel the invitation to {string}",
  async ({ page }, email: string) => {
    await page
      .getByRole("button", { name: `Cancel invitation to ${email}` })
      .click();
  },
);

Then(
  "I do not see {string} listed as a pending invitation",
  async ({ page }, email: string) => {
    await expect(page.getByText(email, { exact: true })).toHaveCount(0);
  },
);

When("I accept the invitation", async ({ page }) => {
  await page.getByRole("button", { name: "Accept" }).click();
});

When("I decline the invitation", async ({ page }) => {
  await page.getByRole("button", { name: "Decline" }).click();
});

Then("I see the registry in my registries list", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: INVITED_REGISTRY_TITLE }),
  ).toBeVisible();
});

Then("I do not see the registry in my registries list", async ({ page }) => {
  await expect(
    page.getByRole("link", { name: INVITED_REGISTRY_TITLE }),
  ).toHaveCount(0);
});

Then("I can edit the registry", async ({ page }) => {
  await page.getByRole("link", { name: INVITED_REGISTRY_TITLE }).click();
  await page.getByRole("heading", { name: INVITED_REGISTRY_TITLE }).waitFor();
  await expect(page.getByRole("button", { name: "Edit registry" })).toBeVisible();
});

When("I remove that co-owner", async ({ page }) => {
  // Removing a co-owner asks for confirmation (window.confirm); Playwright
  // dismisses dialogs by default, which would cancel the removal.
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", {
      name: `Remove co-owner ${REMOVABLE_CO_OWNER_EMAIL}`,
    })
    .click();
});

Then("I do not see them listed as a co-owner", async ({ page }) => {
  await expect(
    page.getByText(REMOVABLE_CO_OWNER_EMAIL, { exact: true }),
  ).toHaveCount(0);
});

Then("I do not see a way to remove a co-owner", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: /^Remove co-owner / }),
  ).toHaveCount(0);
});

Given(
  "I am a co-owner of a registry owned by another real account",
  async ({ account, otherAccount, registry }) => {
    await createTestAccount(otherAccount);

    const created = await createTestRegistry(
      otherAccount.userId,
      INVITED_REGISTRY_TITLE,
    );
    registry.id = created.id;
    registry.shareToken = created.shareToken;

    await createTestInvitation(registry.id, account.email, {
      invitedByUserId: otherAccount.userId,
      status: "accepted",
      acceptedByUserId: account.userId,
    });
  },
);

Then(
  "I see the owner's email listed as a co-owner",
  async ({ page, otherAccount }) => {
    await expect(
      page.getByTestId("co-owners-section").getByText(otherAccount.email),
    ).toBeVisible();
  },
);

Then(
  "I do not see my own email listed as a co-owner",
  async ({ page, account }) => {
    // Scoped to the co-owners section, not the whole page — the signed-in
    // account's own email legitimately appears once in the site header.
    await expect(
      page
        .getByTestId("co-owners-section")
        .getByText(account.email, { exact: true }),
    ).toHaveCount(0);
  },
);
