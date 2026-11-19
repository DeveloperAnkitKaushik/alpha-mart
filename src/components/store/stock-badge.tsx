"use client";

import { useStoreEnabled } from "@/components/store/store-flag";
import { useStock } from "@/lib/store/client-data";

function Badge({ productId }: { productId: string }) {
  const stock = useStock();
  if (stock === undefined) return null;
  const left = stock[productId] ?? 0;
  if (left > 3) return null;
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${left === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
      {left === 0 ? "Sold out" : `Only ${left} left`}
    </span>
  );
}

export function StockBadge({ productId }: { productId: string }) {
  return useStoreEnabled() ? <Badge productId={productId} /> : null;
}
