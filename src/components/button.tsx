import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "claim" | "ghost" | "text";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "rounded-full bg-violet text-violet-ink hover:opacity-90",
  claim: "rounded-full bg-coral text-coral-ink hover:opacity-90",
  ghost:
    "rounded-full border border-line bg-transparent text-ink hover:border-violet hover:text-violet",
  text: "text-violet hover:underline underline-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  const sizeClass = variant === "text" ? "" : sizeClasses[size];
  return `${base} ${variantClasses[variant]} ${sizeClass}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    />
  );
}
