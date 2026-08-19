"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Pill, type PillTone } from "@/components/pill";
import { inputClass, labelClass } from "@/components/field";
import { updateGift, deleteGift } from "@/app/registries/[id]/actions";
import {
  GIFT_NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  QUANTITY_MAX,
} from "@/lib/field-limits";

type Gift = {
  id: string;
  name: string;
  notes: string | null;
  quantity: number;
};

export function GiftCard({
  gift,
  registryId,
  canManage,
  showClaims,
  claimed,
}: {
  gift: Gift;
  registryId: string;
  canManage: boolean;
  showClaims: boolean;
  claimed: number;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateGift(registryId, gift.id, formData);
    setIsEditing(false);
  }

  const testId = `gift-card-${gift.name}`;

  if (isEditing) {
    return (
      <li
        data-testid={testId}
        className="rounded-2xl border border-violet/40 bg-surface p-4 shadow-sm"
      >
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`name-${gift.id}`} className={labelClass}>
              Gift name
            </label>
            <input
              id={`name-${gift.id}`}
              name="name"
              type="text"
              required
              maxLength={GIFT_NAME_MAX_LENGTH}
              defaultValue={gift.name}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`notes-${gift.id}`} className={labelClass}>
              Notes (optional)
            </label>
            <textarea
              id={`notes-${gift.id}`}
              name="notes"
              maxLength={NOTES_MAX_LENGTH}
              defaultValue={gift.notes ?? ""}
              className={inputClass}
            />
          </div>

          <div className="flex w-24 flex-col gap-1.5">
            <label htmlFor={`quantity-${gift.id}`} className={labelClass}>
              Quantity
            </label>
            <input
              id={`quantity-${gift.id}`}
              name="quantity"
              type="number"
              min="1"
              max={QUANTITY_MAX}
              defaultValue={gift.quantity}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <SubmitButton size="sm">Save changes</SubmitButton>
            <button
              type="button"
              className={buttonClasses("ghost", "sm")}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  const tone: PillTone =
    claimed === 0
      ? "available"
      : claimed < gift.quantity
        ? "partial"
        : "claimed";
  const label =
    claimed === 0
      ? "Available"
      : claimed < gift.quantity
        ? `${claimed} of ${gift.quantity} claimed`
        : "Claimed";

  return (
    <li
      data-testid={testId}
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-ink">{gift.name}</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            Quantity: {gift.quantity}
          </p>
          {gift.notes && (
            <p className="mt-1 break-words text-xs text-ink-dim">
              {gift.notes}
            </p>
          )}
        </div>
        {showClaims && <Pill tone={tone}>{label}</Pill>}
      </div>
      {canManage && (
        <div className="mt-3 flex gap-4">
          <button
            type="button"
            aria-label={`Edit ${gift.name}`}
            className={buttonClasses("text", "sm")}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <form action={deleteGift.bind(null, registryId, gift.id)}>
            <ConfirmSubmitButton
              confirmMessage={`Remove "${gift.name}" from the registry? If a guest has already claimed it, their claim disappears too.`}
              variant="text"
              size="sm"
              aria-label={`Remove ${gift.name}`}
            >
              Remove
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </li>
  );
}
