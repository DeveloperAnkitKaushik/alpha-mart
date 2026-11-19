"use client";

import { memo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { EmptyCart, TotalsCard, useCartReady, useTotals } from "@/components/store/cart-shared";
import { useSiteContent } from "@/components/site/site-content";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/data";
import { useCart } from "@/lib/store/cart-store";
import { useStock } from "@/lib/store/client-data";
import { couponCodeSchema } from "@/lib/store/schemas";

const MAX_QTY = 10;
const stepBtn = "grid size-11 place-items-center transition hover:bg-cream disabled:opacity-40";

const CartRow = memo(function CartRow({ index }: { index: number }) {
  const line = useCart((s) => s.lines[index]);
  const products = useSiteContent().products;
  const stock = useStock();
  if (!line) return null;
  const deal = products.find((p) => p.id === line.productId);
  const cap = stock === undefined ? MAX_QTY : Math.min(stock[line.productId] ?? 0, MAX_QTY);
  const options = Object.entries(line.options).map(([k, v]) => `${k}: ${v}`).join(" · ");

  return (
    <li className="flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-border">
      <ShopImage src={deal?.images[0]} className="size-24 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy-deep">{deal?.name ?? "Unavailable item"}</p>
        {options && <p className="mt-0.5 text-xs text-muted-foreground">{options}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-xl ring-1 ring-border" role="group" aria-label="Quantity">
            <button type="button" aria-label="Decrease quantity" disabled={line.qty <= 1} onClick={() => useCart.getState().setQty(index, line.qty - 1)} className={stepBtn}>
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold" aria-live="polite">{line.qty}</span>
            <button type="button" aria-label="Increase quantity" disabled={line.qty >= cap} onClick={() => useCart.getState().setQty(index, line.qty + 1)} className={stepBtn}>
              <Plus className="size-4" />
            </button>
          </div>
          <button type="button" onClick={() => useCart.getState().remove(index)} className="flex h-11 items-center gap-1.5 px-2 text-sm font-semibold text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  );
});

function Coupon({ applied, error, onApply }: { applied: string | null; error?: string; onApply: (code: string | null) => void }) {
  const [draft, setDraft] = useState("");
  const [local, setLocal] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = couponCodeSchema.safeParse(draft);
    if (!r.success) return setLocal("Enter a valid coupon code.");
    setLocal(undefined);
    onApply(r.data);
  };

  const shown = local ?? error;
  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="coupon" className="text-sm font-medium">Coupon code</label>
      <div className="mt-1.5 flex gap-2">
        <Input id="coupon" value={draft} onChange={(e) => setDraft(e.target.value)} aria-invalid={Boolean(shown)} className="h-11 uppercase" />
        <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold ring-1 ring-border hover:bg-cream">Apply</button>
      </div>
      {shown && <p role="alert" className="mt-1.5 text-xs text-destructive">{shown}</p>}
      {applied && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {shown ? `${applied} can't be used.` : `${applied} applied.`}{" "}
          <button type="button" onClick={() => { setDraft(""); setLocal(undefined); onApply(null); }} className="font-semibold underline">Remove</button>
        </p>
      )}
    </form>
  );
}

export function CartView() {
  const ready = useCartReady();
  const lines = useCart((s) => s.lines);
  const [code, setCode] = useState<string | null>(null);
  const result = useTotals(lines, code);

  if (!ready) return null;
  if (lines.length === 0) return <EmptyCart />;

  const href = code ? `/checkout?code=${code}&next=${encodeURIComponent(`/checkout?code=${code}`)}` : "/checkout?next=%2Fcheckout";
  const canCheckout = Boolean(result.totals) && !result.couponError;
  const total = result.totals?.total;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-3">
        {lines.map((l, i) => (
          <CartRow key={`${l.productId}|${JSON.stringify(l.options)}`} index={i} />
        ))}
      </ul>
      <TotalsCard result={result}>
        <Coupon applied={code} error={result.couponError} onApply={setCode} />
        {result.error && result.refetch && (
          <button type="button" onClick={() => void result.refetch()} className="mt-3 text-sm font-semibold underline">Try again</button>
        )}
        {canCheckout ? (
          <Link href={href} className="mt-5 grid h-12 place-items-center rounded-xl bg-ember font-bold text-white">
            Checkout{total !== undefined ? ` · ${formatPrice(total)}` : ""}
          </Link>
        ) : (
          <button type="button" disabled className="mt-5 h-12 w-full rounded-xl bg-muted font-bold text-muted-foreground">Checkout</button>
        )}
      </TotalsCard>
    </div>
  );
}
