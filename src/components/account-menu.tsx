"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/app/sign-out-button";

const menuItemClass =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-canvas";

// Who's signed in, in the site header. Clicking it opens a small menu with
// a link to account settings and the sign-out button — closing on an
// outside click keeps it from lingering open while the visitor browses.
//
// Reads the profile via useUser() rather than as server-rendered props —
// this component is only mounted once the parent server component already
// confirmed (cheaply, via auth()) that someone is signed in, so it just
// needs the display details, and Clerk's client SDK already has those
// loaded from the session without a further server round trip. It also
// means an edit made through user.update() (see account-form.tsx) shows up
// here immediately, since both read the same client-side Clerk store.
export function AccountMenu() {
  const { isLoaded, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // The parent header already confirmed (server-side, via auth()) that
  // someone is signed in, so this is just the brief window before Clerk's
  // client SDK finishes hydrating — hold the chip's footprint so the
  // header doesn't shift when the real button appears.
  if (!isLoaded || !user) {
    return (
      <div
        className="h-9 w-32 animate-pulse rounded-full border border-line bg-canvas"
        aria-hidden="true"
      />
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    email ||
    "Account";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-violet"
      >
        <Avatar email={email} />
        {displayName}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className={menuItemClass}
          >
            Account settings
          </Link>
          <SignOutButton className={menuItemClass} />
        </div>
      )}
    </div>
  );
}
