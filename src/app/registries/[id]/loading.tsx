import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <Skeleton className="h-3.5 w-40" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="flex flex-col gap-6">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </main>
  );
}
