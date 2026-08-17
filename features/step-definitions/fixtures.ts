import { test as base } from "playwright-bdd";

type RegistryFixture = { id: string; shareToken: string; oldShareUrl: string };

type Fixtures = {
  account: { email: string; password: string; userId: string };
  // A second real Clerk account, only created by scenarios that need one
  // (e.g. a co-owner viewing a registry actually owned by someone else's
  // real account, to check what's displayed for that owner) — most
  // scenarios only need `account` and a fake owner/claimant id string.
  otherAccount: { email: string; password: string; userId: string };
  registry: RegistryFixture;
  // Separate from `registry` so a scenario can hold both "my registry" and
  // "someone else's registry" at once (e.g. viewing a registry list that
  // should only show the signed-in user's own registries).
  otherRegistry: RegistryFixture;
};

export const test = base.extend<Fixtures>({
  account: async ({}, use) => {
    await use({ email: "", password: "", userId: "" });
  },
  otherAccount: async ({}, use) => {
    await use({ email: "", password: "", userId: "" });
  },
  registry: async ({}, use) => {
    await use({ id: "", shareToken: "", oldShareUrl: "" });
  },
  otherRegistry: async ({}, use) => {
    await use({ id: "", shareToken: "", oldShareUrl: "" });
  },
});
