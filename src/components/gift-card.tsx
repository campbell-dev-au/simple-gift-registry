"use client";

import { useState } from "react";
import { buttonClasses, Button } from "@/components/button";
import { Pill, type PillTone } from "@/components/pill";
import { inputClass, labelClass } from "@/components/field";
import { updateGift, deleteGift } from "@/app/registries/[id]/actions";

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
              defaultValue={gift.quantity}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" size="sm">
              Save changes
            </Button>
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
        <div>
          <p className="font-semibold text-ink">{gift.name}</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            Quantity: {gift.quantity}
          </p>
          {gift.notes && (
            <p className="mt-1 text-xs text-ink-dim">{gift.notes}</p>
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
            <button
              type="submit"
              aria-label={`Remove ${gift.name}`}
              className={buttonClasses("text", "sm")}
            >
              Remove
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
