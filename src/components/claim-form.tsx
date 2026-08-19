"use client";

import { useActionState } from "react";
import { claimGift, type ClaimResult } from "@/app/share/[token]/actions";
import { SubmitButton } from "@/components/submit-button";
import { inputClass } from "@/components/field";

// The guest-facing claim form. useActionState surfaces the action's
// outcome inline — mainly for the race where someone else claims the gift
// first, which previously just re-rendered as if the click never happened.
export function ClaimForm({
  token,
  giftId,
  giftName,
  remaining,
}: {
  token: string;
  giftId: string;
  giftName: string;
  remaining: number;
}) {
  const [state, formAction] = useActionState<ClaimResult, FormData>(
    claimGift.bind(null, token, giftId),
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={`quantity-${giftId}`} className="sr-only">
          Quantity to claim
        </label>
        <input
          id={`quantity-${giftId}`}
          name="quantity"
          type="number"
          min={1}
          max={remaining}
          defaultValue={1}
          className={`${inputClass} !w-16 py-1.5 text-center font-mono text-sm`}
        />
        <SubmitButton
          variant="claim"
          size="sm"
          aria-label={`Claim ${giftName}`}
        >
          Claim
        </SubmitButton>
      </div>
      {state?.error && (
        <p className="text-sm text-amber" role="status">
          {state.error}
        </p>
      )}
    </form>
  );
}
