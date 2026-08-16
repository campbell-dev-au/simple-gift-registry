"use client";

import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button onClick={() => signOut({ redirectUrl: "/" })} className="underline">
      Sign out
    </button>
  );
}
