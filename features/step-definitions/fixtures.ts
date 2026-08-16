import { test as base } from "playwright-bdd";

type Fixtures = {
  account: { email: string; password: string; userId: string };
  registry: { id: string };
  // Separate from `registry` so a scenario can hold both "my registry" and
  // "someone else's registry" at once (e.g. viewing a registry list that
  // should only show the signed-in user's own registries).
  otherRegistry: { id: string };
};

export const test = base.extend<Fixtures>({
  account: async ({}, use) => {
    await use({ email: "", password: "", userId: "" });
  },
  registry: async ({}, use) => {
    await use({ id: "" });
  },
  otherRegistry: async ({}, use) => {
    await use({ id: "" });
  },
});
