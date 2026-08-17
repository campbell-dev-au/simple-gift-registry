"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";
import { NAME_MAX_LENGTH } from "@/lib/field-limits";

// Saves via the client-side user.update() rather than a server action —
// Clerk's client SDK holds one shared user record across the app, so a
// client-side update is what lets the header's account menu (also reading
// via useUser()) pick up the new name immediately, with no revalidation
// plumbing needed to bridge a server-side write back to the client store.
export function AccountForm() {
  const { isLoaded, user } = useUser();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  if (!isLoaded || !user) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("saving");
    await user.update({
      firstName: (formData.get("firstName") as string).trim(),
      lastName: (formData.get("lastName") as string).trim(),
    });
    setStatus("saved");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-dim">
        {user.primaryEmailAddress?.emailAddress}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            maxLength={NAME_MAX_LENGTH}
            defaultValue={user.firstName ?? ""}
            onChange={() => setStatus("idle")}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            maxLength={NAME_MAX_LENGTH}
            defaultValue={user.lastName ?? ""}
            onChange={() => setStatus("idle")}
            className={inputClass}
          />
        </div>

        <Button type="submit" disabled={status === "saving"}>
          {status === "saved" ? "Saved" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
