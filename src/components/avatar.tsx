function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0]![0] + parts[1]![0] : local.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({
  email,
  className = "",
}: {
  email: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-[11px] font-bold text-violet-ink ${className}`}
      title={email}
    >
      {initialsFromEmail(email)}
    </span>
  );
}
