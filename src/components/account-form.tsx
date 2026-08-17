"use client";

import { useState } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import {
  isClerkAPIResponseError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";
import { Button } from "@/components/button";
import { inputClass, labelClass, sectionTitleClass } from "@/components/field";
import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/field-limits";

function describeError(err: unknown) {
  if (isClerkAPIResponseError(err)) {
    return (
      err.errors[0]?.longMessage ??
      err.errors[0]?.message ??
      "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}

// Saves via the client-side user.update() rather than a server action —
// Clerk's client SDK holds one shared user record across the app, so a
// client-side update is what lets the header's account menu (also reading
// via useUser()) pick up the new name immediately, with no revalidation
// plumbing needed to bridge a server-side write back to the client store.
export function AccountForm() {
  const { isLoaded, user } = useUser();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Changing a password is a sensitive action Clerk gates behind session
  // reverification — useReverification shows Clerk's built-in "confirm your
  // password" modal when the session isn't fresh enough, then retries.
  const updatePassword = useReverification(
    (params: { currentPassword?: string; newPassword: string }) =>
      user!.updatePassword(params),
  );

  if (!isLoaded || !user) return null;

  // Google-authenticated accounts have no local password, and their name
  // comes from the Google profile, so editing either here doesn't apply.
  const hasGoogleAccount = user.externalAccounts.some(
    (account) => account.provider === "google",
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("saving");
    setError(null);
    try {
      await user.update({
        firstName: (formData.get("firstName") as string).trim(),
        lastName: (formData.get("lastName") as string).trim(),
      });
      setStatus("saved");
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
    }
  };

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordStatus("saving");
    setPasswordError(null);
    try {
      await updatePassword({
        ...(user.passwordEnabled ? { currentPassword } : {}),
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordStatus("saved");
    } catch (err) {
      setPasswordStatus("idle");
      if (!isReverificationCancelledError(err)) {
        setPasswordError(describeError(err));
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-dim">
        {user.primaryEmailAddress?.emailAddress}
      </p>

      {hasGoogleAccount ? (
        <p className="text-sm text-ink-dim">
          Your name and password are managed by your Google account.
        </p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className={labelClass}>
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
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
                required
                maxLength={NAME_MAX_LENGTH}
                defaultValue={user.lastName ?? ""}
                onChange={() => setStatus("idle")}
                className={inputClass}
              />
            </div>

            <Button type="submit" disabled={status === "saving"}>
              {status === "saved" ? "Saved" : "Save changes"}
            </Button>
            {error && <p className="text-sm text-coral">{error}</p>}
          </form>

          <div className="flex flex-col gap-4 border-t border-line pt-4">
            <h2 className={sectionTitleClass}>Password</h2>
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              {user.passwordEnabled && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="currentPassword" className={labelClass}>
                    Current password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordStatus("idle");
                    }}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="newPassword" className={labelClass}>
                  {user.passwordEnabled ? "New password" : "Password"}
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordStatus("idle");
                  }}
                  className={inputClass}
                />
              </div>

              <Button type="submit" disabled={passwordStatus === "saving"}>
                {passwordStatus === "saved"
                  ? "Saved"
                  : user.passwordEnabled
                    ? "Change password"
                    : "Set password"}
              </Button>
              {passwordError && (
                <p className="text-sm text-coral">{passwordError}</p>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
