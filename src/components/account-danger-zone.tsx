"use client";

import { useActionState } from "react";
import {
  deleteAllAccountData,
  deleteAccount,
} from "@/app/account/actions";
import type { ActionResult } from "@/lib/action-result";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { sectionTitleClass } from "@/components/field";

// The two irreversible account actions, each behind an explicit browser
// confirmation. Deleting the account redirects home from the action, so
// only the data-wipe needs a visible result here.
export function AccountDangerZone() {
  const [wipeState, wipeAction] = useActionState<ActionResult, FormData>(
    deleteAllAccountData,
    null,
  );

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

      <form action={deleteAccount} className="flex flex-col gap-2">
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
