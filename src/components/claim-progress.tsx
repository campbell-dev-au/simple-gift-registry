export function ClaimProgress({
  claimed,
  total,
}: {
  claimed: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.min(100, Math.round((claimed / total) * 100));

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-mint"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold whitespace-nowrap text-ink-dim">
        {claimed} of {total} claimed
      </span>
    </div>
  );
}
