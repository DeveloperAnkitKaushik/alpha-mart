import { Skeleton } from "@/components/ui/skeleton";

// Page-shaped placeholders so the layout doesn't jump when content arrives.

function CardGridSkeleton({ count = 6, className = "sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl bg-white p-3 ring-1 ring-border">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <Skeleton className="mt-3 h-4 w-4/5" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
          <Skeleton className="mt-3 h-6 w-1/2" />
          <Skeleton className="mt-3 h-10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <div className="container-x pt-6 pb-16" aria-busy="true" aria-label="Loading products">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mx-auto mt-8 h-9 w-2/3 max-w-xl" />
      <Skeleton className="mx-auto mt-3 h-4 w-1/2 max-w-md" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[16.5rem_1fr]">
        <div className="hidden space-y-3 rounded-2xl bg-white p-5 ring-1 ring-border lg:block">
          <Skeleton className="h-10" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        <CardGridSkeleton />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-x pt-6 pb-16" aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-4 w-64" />
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <Skeleton className="aspect-[4/3] rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-5/6" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-11 w-1/2" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormCardSkeleton() {
  return (
    <div className="container-x py-10" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-md space-y-3 rounded-3xl bg-white p-8 ring-1 ring-border">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-11 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
  );
}
