"use client";

import { useActionState } from "react";
import { unlockShareRegistry } from "@/app/share/[token]/actions";
import type { ActionResult } from "@/lib/action-result";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass } from "@/components/field";
import { SHARE_PASSWORD_MAX_LENGTH } from "@/lib/field-limits";

// Shown in place of a password-protected share page until the guest enters
// the password. A correct entry sets the unlock cookie and revalidates, so
// the page re-renders straight into the registry; a wrong one comes back
// inline here.
export function SharePasswordGate({
  token,
  title,
}: {
  token: string;
  title: string;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    unlockShareRegistry.bind(null, token),
    null,
  );

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-[26px] font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-dim">
          This registry is password protected. Enter the password from
          whoever shared the link with you.
        </p>
      </div>

      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="share-password" className={labelClass}>
            Password
          </label>
          <input
            id="share-password"
            name="password"
            type="password"
            required
            autoFocus
            maxLength={SHARE_PASSWORD_MAX_LENGTH}
            className={inputClass}
          />
        </div>
        <SubmitButton>View registry</SubmitButton>
        {state && "error" in state && (
          <p className="text-sm text-amber" role="status">
            {state.error}
          </p>
        )}
      </form>
    </main>
  );
}
