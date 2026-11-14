import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata = { title: "Dashboard — Alpha Mart" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-24">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
      <DashboardView />
    </div>
  );
}
