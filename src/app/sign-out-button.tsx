"use client";

import { useClerk } from "@clerk/nextjs";
import { buttonClasses } from "@/components/button";

export function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/" })}
      className={className ?? buttonClasses("text")}
    >
      Sign out
    </button>
  );
}
