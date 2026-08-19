"use client";

import { useActionState, useState } from "react";
import {
  setSharePassword,
  removeSharePassword,
} from "@/app/registries/[id]/actions";
import type { ActionResult } from "@/lib/action-result";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { buttonClasses } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";
import {
  SHARE_PASSWORD_MIN_LENGTH,
  SHARE_PASSWORD_MAX_LENGTH,
} from "@/lib/field-limits";

// Manage-page controls for the share-page password: set one, view it
// password-manager style (hidden until Show, copyable), change it, or
// remove it. Setting or changing signs every guest out of the registry
// (their unlock cookies die with the old ciphertext — see
// src/lib/share-password.ts), which is exactly what an owner reaching for
// this wants.
export function SharePasswordSection({
  registryId,
  hasPassword,
  // Null while hasPassword when the stored value can't be decrypted (e.g.
  // a rotated SHARE_PASSWORD_KEY) — the reveal row hides and the owner can
  // still change or remove the password.
  sharePassword,
}: {
  registryId: string;
  hasPassword: boolean;
  sharePassword: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction] = useActionState<ActionResult, FormData>(
    setSharePassword.bind(null, registryId),
    null,
  );

  // Leave edit mode when a save lands, adjusted during render (not an
  // effect) per the React "derive state" pattern. The set-password form
  // needs no reset: on success hasPassword flips true and unmounts it.
  const [handledState, setHandledState] = useState<ActionResult>(null);
  if (state !== handledState) {
    setHandledState(state);
    if (state && "ok" in state) setIsEditing(false);
  }

  async function copyPassword() {
    if (!sharePassword) return;
    await navigator.clipboard.writeText(sharePassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const showForm = isEditing || !hasPassword;

  return (
    <div className="flex flex-col gap-2">
      {hasPassword ? (
        <p className="text-sm text-ink-dim">
          Guests need a password to open the share link.
          {state && "ok" in state && !isEditing && " Password saved."}
        </p>
      ) : (
        <p className="text-sm text-ink-dim">
          Optionally require a password before guests can open the share
          link — for registries you&apos;d rather not have one forward away.
        </p>
      )}

      {hasPassword && !isEditing && sharePassword !== null && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            type={revealed ? "text" : "password"}
            value={sharePassword}
            aria-label="Share password"
            className={`${inputClass} font-mono text-sm`}
          />
          {/* aria-labels double as disambiguation from the share link's own
              Copy button just above this section. */}
          <button
            type="button"
            aria-label={revealed ? "Hide share password" : "Show share password"}
            className={buttonClasses("ghost", "sm")}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            aria-label="Copy share password"
            aria-live="polite"
            className={buttonClasses("ghost", "sm")}
            onClick={copyPassword}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {showForm ? (
        <form action={formAction} className="flex flex-col gap-2">
          <label htmlFor="share-password-new" className={labelClass}>
            {hasPassword ? "New password" : "Password"}
          </label>
          <div className="flex gap-2">
            <input
              id="share-password-new"
              name="password"
              type="password"
              required
              minLength={SHARE_PASSWORD_MIN_LENGTH}
              maxLength={SHARE_PASSWORD_MAX_LENGTH}
              className={inputClass}
            />
            <SubmitButton size="sm">
              {hasPassword ? "Change" : "Set password"}
            </SubmitButton>
          </div>
          {state && "error" in state && (
            <p className="text-sm text-amber" role="status">
              {state.error}
            </p>
          )}
          {hasPassword && (
            <button
              type="button"
              className={buttonClasses("ghost", "sm")}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            className={buttonClasses("ghost", "sm")}
            onClick={() => setIsEditing(true)}
          >
            Change password
          </button>
          <form action={removeSharePassword.bind(null, registryId)}>
            <ConfirmSubmitButton
              confirmMessage="Remove the password? Anyone with the share link can open the registry again."
              variant="ghost"
              size="sm"
            >
              Remove password
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
