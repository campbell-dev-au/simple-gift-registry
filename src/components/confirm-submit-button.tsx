"use client";

import type { ButtonHTMLAttributes } from "react";
import { SubmitButton } from "./submit-button";
import type { ButtonSize, ButtonVariant } from "./button";

// A submit button that requires an explicit browser confirmation before the
// form actually submits — for actions that need a deliberate second step
// (e.g. turning on claim visibility, deleting a gift) but don't warrant a
// full custom modal. Builds on SubmitButton, so a confirmed submit still
// gets the disabled-with-spinner pending state.
export function ConfirmSubmitButton({
  confirmMessage,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <SubmitButton
      variant={variant}
      size={size}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      {...props}
    />
  );
}
