import { Skeleton, SkeletonCard } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-ink">
          My registries
        </h1>
        <Skeleton className="h-9 w-44 rounded-full" />
      </div>
      <section className="flex flex-col gap-3">
        <Skeleton className="h-4 w-16" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    </main>
  );
}
