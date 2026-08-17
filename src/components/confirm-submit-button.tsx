"use client";

import type { ButtonHTMLAttributes } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

// A plain submit button that requires an explicit browser confirmation
// before the form actually submits — for actions that need a deliberate
// second step (e.g. turning on claim visibility) but don't warrant a full
// custom modal.
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
    <Button
      type="submit"
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
