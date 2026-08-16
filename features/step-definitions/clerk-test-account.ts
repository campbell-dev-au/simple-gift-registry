import { randomUUID } from "node:crypto";
import { createClerkClient } from "@clerk/backend";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

type TestAccount = { email: string; password: string; userId: string };

// Seeds a real Clerk user directly via the Backend API rather than through
// the sign-up UI — keeps scenarios that need "an existing account" fast and
// independent of the sign-up flow. The +clerk_test subaddress keeps any
// downstream verification steps deterministic (fixed 424242 code, no real
// email sent). https://clerk.com/docs/testing/test-emails-and-phones
export async function createTestAccount(account: TestAccount) {
  // A random hex suffix rather than Date.now() — with several @registry-
  // tagged scenarios now starting their Before hooks near-simultaneously
  // across parallel workers, millisecond timestamps can collide. Sliced to
  // 8 chars: the full 36-char randomUUID() pushes the local part (before
  // @) past the 64-char RFC limit once combined with the other fixed text,
  // which Clerk rejects as "not a valid email address".
  account.email = `gift-registry-test-${randomUUID().slice(0, 8)}+clerk_test@example.com`;
  account.password = "Correct-Horse-Battery-Staple-1!";

  const user = await clerkClient.users.createUser({
    emailAddress: [account.email],
    password: account.password,
  });
  account.userId = user.id;
}

export async function deleteTestAccount(account: TestAccount) {
  if (account.userId) {
    await clerkClient.users.deleteUser(account.userId);
  }
}
