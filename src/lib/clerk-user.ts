import { currentUser } from "@clerk/nextjs/server";

// currentUser() intermittently throws a resource_not_found error for the
// requesting user's own (just-created, real, signed-in) account — observed
// against Clerk's dev instance, evidently a brief eventual-consistency gap
// on their end rather than anything wrong with the session. Since a valid
// session's own user record can't legitimately be missing, a couple of
// short retries clears it without masking a real error (a persistent
// failure still throws after the last attempt).
export async function currentUserWithRetry(attempts = 3, delayMs = 300) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await currentUser();
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

export function verifiedEmailsOf(
  user: Awaited<ReturnType<typeof currentUser>>,
) {
  return (user?.emailAddresses ?? [])
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());
}
