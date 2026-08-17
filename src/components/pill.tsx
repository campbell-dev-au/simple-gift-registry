export type PillTone = "available" | "partial" | "claimed" | "neutral";

const toneClasses: Record<PillTone, string> = {
  available: "bg-mint/10 text-mint",
  partial: "bg-amber/10 text-amber",
  claimed: "bg-violet/10 text-violet",
  neutral: "bg-ink/5 text-ink-dim",
};

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: PillTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
