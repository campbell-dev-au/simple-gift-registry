import { test as base } from "playwright-bdd";

type Fixtures = {
  account: { email: string; password: string; userId: string };
  registry: { id: string };
};

export const test = base.extend<Fixtures>({
  account: async ({}, use) => {
    await use({ email: "", password: "", userId: "" });
  },
  registry: async ({}, use) => {
    await use({ id: "" });
  },
});
