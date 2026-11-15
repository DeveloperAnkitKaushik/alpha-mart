import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export const metadata = { title: "Dashboard — Alpha Mart" };

export default function DashboardPage() {
  return (
    <div className="min-h-[70vh] bg-cream">
      <div className="container-x pt-10 pb-24">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardView />
        </Suspense>
      </div>
    </div>
  );
}
