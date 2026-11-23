"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { StateCard } from "@/components/site/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-store";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/store/cart-store";
import { previewTotals } from "@/lib/store/checkout-actions";
import type { CartLine } from "@/lib/store/schemas";

export const PRICE_ERROR = "Couldn't load prices right now. Try again.";

type Preview = Awaited<ReturnType<typeof previewTotals>>;
export type Totals = Extract<Preview, { ok: true }>;

// The cart store hydrates from localStorage after mount; wait so a saved cart never flashes as empty.
export const useCartReady = () =>
  useSyncExternalStore(
    (notify) => useCart.persist.onFinishHydration(notify),
    () => useCart.persist.hasHydrated(),
    () => false,
  );

function usePreview(lines: CartLine[], code: string | null, enabled: boolean) {
  const uid = useAuth((s) => s.user?.uid ?? null);
  return useQuery({
    queryKey: ["totals", uid, lines, code],
    enabled: enabled && lines.length > 0,
    retry: false,
    staleTime: 0,
    queryFn: () => previewTotals(lines, code),
  });
}

// previewTotals is the source of truth. A rejected coupon is told apart from a rejected line
// by re-running without the code.
export function useTotals(lines: CartLine[], code: string | null) {
  const main = usePreview(lines, code, true);
  const failed = main.data?.ok === false;
  const bare = usePreview(lines, null, Boolean(code) && failed);

  if (main.isError || bare.isError) return { error: PRICE_ERROR, refetch: main.refetch };
  if (main.isPending || (code && failed && bare.isPending)) return { loading: true };
  const data = main.data;
  if (!data) return { loading: true };
  if (data.ok) return { totals: data };
  if (!code) return { error: data.error };
  if (bare.data?.ok) return { totals: bare.data, couponError: data.error };
  return { error: bare.data?.error ?? data.error };
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-lg font-extrabold text-navy-deep" : "flex justify-between text-sm"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function TotalsCard({ result, children }: { result: ReturnType<typeof useTotals>; children?: React.ReactNode }) {
  const { totals, error, loading } = result;
  return (
    <aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-border">
      <h2 className="text-lg font-extrabold text-navy-deep">Order summary</h2>
      {loading && (
        <div className="mt-4 space-y-3" aria-busy>
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-6" />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {totals && (
        <dl className="mt-4 space-y-2">
          <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
          <Row label="Discount" value={totals.discount ? `-${formatPrice(totals.discount)}` : formatPrice(0)} />
          <Row label="Delivery" value="Free delivery" />
          <div className="border-t border-border pt-2">
            <Row label="Total" value={formatPrice(totals.total)} strong />
          </div>
        </dl>
      )}
      {children}
    </aside>
  );
}

export function EmptyCart() {
  return (
    <StateCard icon={ShoppingBag} title="Your cart is empty" body="Browse our laptops and add something you like.">
      <Link href="/collections/all" className="grid h-11 place-items-center rounded-xl bg-ember px-6 font-bold text-white">
        Continue shopping
      </Link>
    </StateCard>
  );
}
