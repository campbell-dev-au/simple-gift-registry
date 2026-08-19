"use client";

import { useActionState } from "react";
import { createRegistry } from "@/app/registries/new/actions";
import type { ActionResult } from "@/lib/action-result";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass } from "@/components/field";
import { TITLE_MAX_LENGTH } from "@/lib/field-limits";

// Client wrapper for the create form so a cap or validation error from the
// server comes back inline (via useActionState) instead of an error page;
// a successful create redirects from the action.
export function NewRegistryForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    createRegistry,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Registry title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={TITLE_MAX_LENGTH}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="eventDate" className={labelClass}>
          Event date (optional)
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          className={inputClass}
        />
      </div>

      <SubmitButton>Create registry</SubmitButton>
      {state && "error" in state && (
        <p className="text-sm text-amber" role="status">
          {state.error}
        </p>
      )}
    </form>
  );
}
