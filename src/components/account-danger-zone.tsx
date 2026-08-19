"use client";

import { useActionState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  deleteAllAccountData,
  deleteAccount,
} from "@/app/account/actions";
import type { ActionResult } from "@/lib/action-result";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { sectionTitleClass } from "@/components/field";

// The two irreversible account actions, each behind an explicit browser
// confirmation.
export function AccountDangerZone() {
  const { signOut } = useClerk();

  const [wipeState, wipeAction] = useActionState<ActionResult, FormData>(
    deleteAllAccountData,
    null,
  );

  // Once the server confirms the account is gone, clear the browser's Clerk
  // session too — the server-side revocation alone leaves the short-lived
  // session JWT looking valid for up to a minute (see deleteAccount in
  // src/app/account/actions.ts). Against an already-deleted session
  // signOut can reject or never settle, so it's raced against a timeout
  // and the navigation home happens unconditionally.
  const [, deleteAction] = useActionState<ActionResult, FormData>(async () => {
    const result = await deleteAccount();
    if (result && "error" in result) return result;
    try {
      await Promise.race([
        signOut(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // Session already unusable — exactly the state signOut was for.
    }
    // A full-page navigation on purpose (not router.push): everything must
    // re-render with no session, with no client-side cache surviving.
    window.location.assign(window.location.origin);
    return null;
  }, null);

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      <h2 className={sectionTitleClass}>Delete data</h2>

      <form action={wipeAction} className="flex flex-col gap-2">
        <p className="text-sm text-ink-dim">
          Permanently delete every registry you own (including its gifts and
          guests&apos; claims), plus your claims, saves, and co-ownerships on
          other registries. Your account stays.
        </p>
        <div>
          <ConfirmSubmitButton
            confirmMessage="Delete all your data? Every registry you own disappears for its guests and co-owners too. This cannot be undone."
            variant="ghost"
            size="sm"
          >
            Delete all my data
          </ConfirmSubmitButton>
        </div>
        {wipeState && "ok" in wipeState && (
          <p className="text-sm text-mint" role="status">
            All your data has been deleted.
          </p>
        )}
        {wipeState && "error" in wipeState && (
          <p className="text-sm text-amber" role="status">
            {wipeState.error}
          </p>
        )}
      </form>

      <form action={deleteAction} className="flex flex-col gap-2">
        <p className="text-sm text-ink-dim">
          Or delete your account entirely — all of the above, plus the
          account itself and its sign-in.
        </p>
        <div>
          <ConfirmSubmitButton
            confirmMessage="Delete your account and all its data? You'll be signed out and there is no way back."
            variant="ghost"
            size="sm"
          >
            Delete my account
          </ConfirmSubmitButton>
        </div>
      </form>
    </div>
  );
}
