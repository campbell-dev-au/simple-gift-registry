"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteCoOwner } from "@/app/registries/[id]/actions";
import type { ActionResult } from "@/lib/action-result";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass } from "@/components/field";
import { EMAIL_MAX_LENGTH } from "@/lib/field-limits";

// Invite form with inline feedback: a bad email gets a message instead of
// an error page, and a successful invite clears the input and says what
// happens next (no email is sent — the invitee sees the invitation on
// their registries page once signed in with that address).
export function InviteCoOwnerForm({ registryId }: { registryId: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    inviteCoOwner.bind(null, registryId),
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "ok" in state && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="co-owner-email" className={labelClass}>
        Invite a co-owner
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id="co-owner-email"
          name="email"
          type="email"
          required
          maxLength={EMAIL_MAX_LENGTH}
          className={inputClass}
        />
        <SubmitButton size="sm">Invite</SubmitButton>
      </div>
      {state && "error" in state && (
        <p className="text-sm text-amber" role="status">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="text-sm text-mint" role="status">
          Invited! They&apos;ll see the invitation on their registries page
          when they sign in with that email.
        </p>
      )}
    </form>
  );
}
