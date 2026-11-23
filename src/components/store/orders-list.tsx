"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PackageOpen, RotateCw, WifiOff } from "lucide-react";
import { OrderStatusBadge } from "@/components/dashboard/badges";
import { SignInView } from "@/components/site/signin-view";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-store";
import { formatPrice } from "@/lib/data";
import { listMyOrders } from "@/lib/store/checkout-actions";

async function loadOrders() {
  const r = await listMyOrders();
  if (!r.ok) throw new Error(r.error);
  return r.orders;
}

function List({ uid }: { uid: string }) {
  const orders = useQuery({ queryKey: ["orders", uid], queryFn: loadOrders });

  if (orders.isError) {
    return (
      <StateCard icon={WifiOff} tone="error" title="We couldn't load your orders" body="Check your connection and try again.">
        <button type="button" onClick={() => void orders.refetch()} className={stateBtn.primary}>
          <RotateCw className="size-4" /> Try again
        </button>
      </StateCard>
    );
  }
  if (!orders.data) return <Skeleton className="h-40" />;
  if (orders.data.length === 0) {
    return (
      <StateCard icon={PackageOpen} title="No orders yet" body="Your orders will show up here once you check out.">
        <Link href="/collections/all" className={stateBtn.primary}>
          Browse laptops
        </Link>
      </StateCard>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.data.map((o) => (
        <li key={o.id}>
          <Link
            href={`/orders/${o.id}`}
            className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-border transition hover:bg-cream"
          >
            <span>
              <span className="block font-bold text-navy-deep">{new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
              <span className="text-sm text-muted-foreground">{formatPrice(o.total)}</span>
            </span>
            <OrderStatusBadge status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrdersList() {
  const ready = useAuth((s) => s.ready);
  const uid = useAuth((s) => s.user?.uid);
  if (!ready) return <Skeleton className="h-40" />;
  if (!uid) return <SignInView embedded />;
  return <List uid={uid} />;
}
