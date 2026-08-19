"use client";

import { useRef } from "react";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass, sectionTitleClass } from "@/components/field";
import { addGift } from "@/app/registries/[id]/actions";
import {
  GIFT_NAME_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  QUANTITY_MAX,
} from "@/lib/field-limits";

export function AddGiftForm({
  registryId,
  onOptimisticAdd,
}: {
  registryId: string;
  onOptimisticAdd?: (gift: {
    name: string;
    notes: string | null;
    quantity: number;
  }) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name) return;

    // Mirror the server's normalisation (see addGift in
    // src/app/registries/[id]/actions.ts) so the optimistic card matches
    // what the revalidated list will show.
    const rawQuantity = Number.parseInt(formData.get("quantity") as string, 10);
    onOptimisticAdd?.({
      name,
      notes: (formData.get("notes") as string) || null,
      quantity:
        Number.isInteger(rawQuantity) && rawQuantity > 0
          ? Math.min(rawQuantity, QUANTITY_MAX)
          : 1,
    });

    // Reset before awaiting: the gift is already visible in the list, and
    // the cleared form lets the user type the next one straight away.
    formRef.current?.reset();
    await addGift(registryId, formData);
  }

  return (
    <form
      ref={formRef}
      action={handleAdd}
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-surface p-4"
    >
      <h2 className={sectionTitleClass}>Add a gift</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="add-gift-name" className={labelClass}>
            Gift name
          </label>
          <input
            id="add-gift-name"
            name="name"
            type="text"
            required
            maxLength={GIFT_NAME_MAX_LENGTH}
            className={inputClass}
          />
        </div>

        <div className="flex w-20 flex-col gap-1.5">
          <label htmlFor="add-gift-quantity" className={labelClass}>
            Quantity
          </label>
          <input
            id="add-gift-quantity"
            name="quantity"
            type="number"
            min="1"
            max={QUANTITY_MAX}
            defaultValue={1}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="add-gift-notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="add-gift-notes"
          name="notes"
          rows={2}
          maxLength={NOTES_MAX_LENGTH}
          className={inputClass}
        />
      </div>

      <div>
        <SubmitButton>Add gift</SubmitButton>
      </div>
    </form>
  );
}
