"use client";

import { useClerk } from "@clerk/nextjs";
import { buttonClasses } from "@/components/button";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/" })}
      className={buttonClasses("text")}
    >
      Sign out
    </button>
  );
}
