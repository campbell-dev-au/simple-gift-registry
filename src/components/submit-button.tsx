"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./button";
import { IconSpinner } from "./icons";

// Submit button for server-action forms. While the surrounding form is
// submitting it disables itself and shows a spinner — the wait for the
// server round trip stays visible, and a double click can't fire the
// action twice. Must be rendered inside the <form> it submits
// (useFormStatus reads the parent form's status).
export function SubmitButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    >
      {pending && <IconSpinner className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}
