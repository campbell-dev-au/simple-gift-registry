"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { inputClass, labelClass } from "@/components/field";
import { updateRegistry } from "@/app/registries/[id]/actions";
import { TITLE_MAX_LENGTH, REGISTRY_NOTES_MAX_LENGTH } from "@/lib/field-limits";
import { formatEventDate } from "@/lib/format-date";

export function RegistryTitleEditor({
  registryId,
  title,
  eventDate,
  notes,
  canManage,
}: {
  registryId: string;
  title: string;
  eventDate: string | null;
  notes: string | null;
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateRegistry(registryId, formData);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form action={handleSave} className="flex max-w-2xl flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="title" className={labelClass}>
              Registry title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={TITLE_MAX_LENGTH}
              defaultValue={title}
              className={`${inputClass} font-display text-lg font-bold`}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:w-56 sm:shrink-0">
            <label htmlFor="eventDate" className={labelClass}>
              Event date (optional)
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              defaultValue={eventDate ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className={labelClass}>
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={REGISTRY_NOTES_MAX_LENGTH}
            defaultValue={notes ?? ""}
            placeholder="Shipping address, sizing, no gift-wrap please…"
            className={inputClass}
          />
          <p className="text-xs text-ink-dim">
            Visible to anyone with the share link.
          </p>
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
    );
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold text-ink">{title}</h1>
      {eventDate && (
        <p className="mt-1.5 text-sm text-ink-dim">
          {formatEventDate(eventDate)}
        </p>
      )}
      {notes && (
        <p className="mt-1.5 max-w-md whitespace-pre-wrap break-words text-sm text-ink-dim">
          {notes}
        </p>
      )}
      {canManage && (
        <button
          type="button"
          className={`${buttonClasses("text")} mt-2`}
          onClick={() => setIsEditing(true)}
        >
          Edit registry
        </button>
      )}
    </div>
  );
}
