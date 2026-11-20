"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { StateCard } from "@/components/site/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/data";
import { listOrders } from "@/lib/store/admin-actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/store/order-state";
import { OrderStatusBadge } from "../badges";
import { AdminError, adminToken, unwrap } from "./admin-call";
import { OrderDrawer } from "./order-drawer";

const FILTERS: (OrderStatus | "all")[] = ["all", ...ORDER_STATUSES];
const label = (s: string) => (s === "all" ? "All orders" : s.replace("_", " ").replace(/^./, (c) => c.toUpperCase()));
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function OrdersTab() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => unwrap(await listOrders(await adminToken(), status)).orders,
    retry: false,
  });
  const open = q.data?.find((o) => o.id === openId) ?? null;

  return (
    <section aria-labelledby="orders-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="orders-title" className="text-xl font-extrabold text-navy-deep">Orders</h2>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          className="h-11 rounded-xl border border-input bg-white px-3 text-sm font-semibold text-navy"
        >
          {FILTERS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>
      {q.isError ? (
        <AdminError what="orders" error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : q.data.length === 0 ? (
        <StateCard icon={PackageSearch} title="No orders here yet" />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Store orders</caption>
            <thead className="bg-cream/70 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="py-3 pr-3 pl-5">Date</th>
                <th scope="col" className="px-3 py-3">Customer</th>
                <th scope="col" className="px-3 py-3 text-right">Total</th>
                <th scope="col" className="py-3 pr-5 pl-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-cream/60">
                  <td className="py-2 pr-3 pl-5 whitespace-nowrap">
                    <button type="button" onClick={() => setOpenId(o.id)} className="min-h-11 text-left font-bold text-navy-deep hover:text-ember focus-visible:underline focus-visible:outline-none">
                      {when(o.createdAt)}
                    </button>
                  </td>
                  <td className="px-3 py-2">{o.address.name}<span className="block text-xs text-muted-foreground">{o.email ?? "No email"}</span></td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{formatPrice(o.total)}</td>
                  <td className="py-2 pr-5 pl-3"><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <OrderDrawer order={open} onClose={() => setOpenId(null)} />
    </section>
  );
}
