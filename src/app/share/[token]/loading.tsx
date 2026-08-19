import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 p-8">
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-2 h-2 w-full max-w-40 rounded-full" />
      </div>
      <div className="flex w-full max-w-md flex-col gap-3">
        <Skeleton className="h-4 w-12" />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </main>
  );
}
