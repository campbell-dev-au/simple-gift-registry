"use client";

import { useState } from "react";
import { Button, buttonClasses } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";
import { updateRegistry } from "@/app/registries/[id]/actions";
import { TITLE_MAX_LENGTH } from "@/lib/field-limits";

export function RegistryTitleEditor({
  registryId,
  title,
  eventDate,
  canManage,
}: {
  registryId: string;
  title: string;
  eventDate: string | null;
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(formData: FormData) {
    await updateRegistry(registryId, formData);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form action={handleSave} className="flex max-w-md flex-col gap-3">
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
            defaultValue={title}
            className={`${inputClass} font-display text-lg font-bold`}
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
            defaultValue={eventDate ?? undefined}
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
    );
  }

  return (
    <div>
      <h1 className="font-display text-[26px] font-bold text-ink">{title}</h1>
      {eventDate && <p className="mt-1.5 text-sm text-ink-dim">{eventDate}</p>}
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
