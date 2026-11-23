"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageSearch, RotateCw, WifiOff } from "lucide-react";
import { OrderStatusBadge } from "@/components/dashboard/badges";
import { SignInView } from "@/components/site/signin-view";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-store";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/store/cart-store";
import { getMyOrder, type OrderView } from "@/lib/store/checkout-actions";
import type { OrderStatus } from "@/lib/store/order-state";
import type { CartLine } from "@/lib/store/schemas";

const POLL_MS = 3000;
const POLL_LIMIT_MS = 2 * 60 * 1000;
const PAID: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];

const lineKey = (l: CartLine) => `${l.productId}|${JSON.stringify(Object.entries(l.options).sort())}|${l.qty}`;

// Clears the cart only while it still holds exactly what this order bought, so opening an old order never wipes a newer cart.
function clearOrderedCart(items: CartLine[]) {
  const cart = useCart.getState().lines.map(lineKey).sort().join();
  if (cart && cart === items.map(lineKey).sort().join()) useCart.getState().clear();
}

function Summary({ order }: { order: OrderView }) {
  const { address: a } = order;
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-navy-deep">Order status</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        {order.trackingNote && <p className="mt-3 text-sm">{order.trackingNote}</p>}
        {order.phonepe.transactionId && (
          <p className="mt-3 text-xs text-muted-foreground">PhonePe transaction ID: {order.phonepe.transactionId}</p>
        )}
      </section>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-border">
        <h2 className="text-lg font-extrabold text-navy-deep">Items</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {order.items.map((l, i) => (
            <li key={`${l.productId}-${i}`} className="flex justify-between gap-3 py-2">
              <span>
                <span className="font-semibold">{l.name}</span> × {l.qty}
                {Object.keys(l.options).length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {Object.entries(l.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </span>
                )}
              </span>
              <span className="font-semibold">{formatPrice(l.unitPrice * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
              <dd>-{formatPrice(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-lg font-extrabold text-navy-deep">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-3xl bg-white p-5 ring-1 ring-border">
        <h2 className="text-lg font-extrabold text-navy-deep">Delivery address</h2>
        <address className="mt-3 text-sm not-italic">
          {a.name} · {a.phone}
          <br />
          {a.line1}
          {a.line2 && `, ${a.line2}`}
          <br />
          {a.city}, {a.state} {a.pincode}
        </address>
      </section>
    </div>
  );
}

function Detail({ uid, orderId }: { uid: string; orderId: string }) {
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const q = useQuery({
    queryKey: ["order", uid, orderId],
    retry: false,
    queryFn: async () => {
      if (!useAuth.getState().user) throw new Error("signed out");
      const r = await getMyOrder(orderId);
      if (r.ok && PAID.includes(r.order.status)) clearOrderedCart(r.order.items);
      return r;
    },
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.ok && d.order.status === "pending_payment" && Date.now() - startedAt < POLL_LIMIT_MS ? POLL_MS : false;
    },
  });

  const pending = q.data?.ok && q.data.order.status === "pending_payment";
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setTimedOut(true), Math.max(0, POLL_LIMIT_MS - (Date.now() - startedAt)));
    return () => clearTimeout(t);
  }, [pending, startedAt]);

  if (q.isError || (q.data && !q.data.ok && q.data.error === "auth")) {
    return (
      <StateCard icon={WifiOff} tone="error" title="We couldn't load this order" body="Check your connection and try again. If you paid, your order is safe.">
        <button type="button" onClick={() => void q.refetch()} className={stateBtn.primary}>
          <RotateCw className="size-4" /> Try again
        </button>
      </StateCard>
    );
  }
  if (!q.data) return <Skeleton className="h-64" />;
  if (!q.data.ok) {
    return (
      <StateCard icon={PackageSearch} title="Order not found" body="We couldn't find this order on your account.">
        <Link href="/orders" className={stateBtn.primary}>
          My orders
        </Link>
      </StateCard>
    );
  }

  const { order } = q.data;
  if (order.status === "failed" || order.status === "expired") {
    return (
      <StateCard icon={WifiOff} tone="error" title="Payment didn't go through. Nothing was charged.">
        <Link href="/cart" className={stateBtn.primary}>
          Back to cart
        </Link>
      </StateCard>
    );
  }
  return (
    <div className="space-y-4">
      {order.status === "pending_payment" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-cream p-4 text-sm font-semibold text-navy ring-1 ring-peach">
          {timedOut ? (
            "Still confirming — refresh in a minute."
          ) : (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Confirming your payment…
            </>
          )}
        </p>
      )}
      {order.checkoutUrl && (
        <a href={order.checkoutUrl} className={stateBtn.primary}>
          Complete payment
        </a>
      )}
      <Summary order={order} />
    </div>
  );
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const ready = useAuth((s) => s.ready);
  const uid = useAuth((s) => s.user?.uid);
  if (!ready) return <Skeleton className="h-64" />;
  if (!uid) return <SignInView embedded />;
  return <Detail key={uid} uid={uid} orderId={orderId} />;
}
