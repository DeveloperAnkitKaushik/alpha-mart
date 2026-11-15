import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the staff layout (header, KPI cards, chart, inbox rows) so nothing jumps when data lands.
export function DashboardSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      {withHeader && (
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-3xl bg-white p-5 ring-1 ring-border">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-3xl bg-white p-6 ring-1 ring-border">
        <Skeleton className="h-5 w-48" />
        <div className="mt-6 flex h-32 items-end gap-2">
          {[40, 65, 30, 80, 55, 90, 45, 70, 35, 60, 85, 50, 75, 40].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-border">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
        <div className="mt-4 divide-y divide-border">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BuyerSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading your enquiries">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-3xl bg-white p-5 ring-1 ring-border">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-5 w-4/5" />
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
