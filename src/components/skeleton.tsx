// Building blocks for route loading.tsx files. Blocks are sized by the
// caller to roughly match the layout they stand in for, so the swap to real
// content doesn't jump.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-line/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Skeleton key={i} className="h-3 w-1/4" />
      ))}
    </div>
  );
}
