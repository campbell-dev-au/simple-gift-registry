import { test as base } from "playwright-bdd";

type AccountFixtures = {
  account: { email: string };
};

export const test = base.extend<AccountFixtures>({
  account: async ({}, use) => {
    await use({ email: "" });
  },
});
