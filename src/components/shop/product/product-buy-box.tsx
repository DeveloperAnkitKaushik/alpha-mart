"use client";

import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Copy, Sparkles, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { AddToCart } from "@/components/store/add-to-cart";
import { FavoriteButton } from "@/components/store/favorite-button";
import { useStoreEnabled } from "@/components/store/store-flag";
import { LeadDialog } from "@/components/site/lead-dialog";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { formatPrice } from "@/lib/data";
import { configPrice, dealToProduct, discountPct, type Deal } from "@/lib/shop-data";
import { findType, offeredOptions } from "@/lib/site-content";
import { useSiteContent } from "@/components/site/site-content";

function Options({ label, values, value, onChange }: { label: string; values: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === i}
            onClick={() => onChange(i)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
              value === i ? "bg-navy text-white ring-navy" : "bg-white text-foreground ring-border hover:ring-navy/50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductBuyBox({ deal }: { deal: Deal }) {
  const { types, sale } = useSiteContent();
  const store = useStoreEnabled();
  const type = findType(types, deal);
  const groups = offeredOptions(type, deal);
  // One picked index per option group; the cheapest value is the default.
  const [picks, setPicks] = useState<number[]>(() => groups.map(() => 0));
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const price = configPrice(deal, groups, picks);
  const mrp = deal.mrp;
  const config = groups.map((g, i) => `${g.values[picks[i] ?? 0]} ${g.name}`).join(" · ");
  const product = { ...dealToProduct(deal, type), name: config ? `${deal.name} (${config})` : deal.name, priceMin: price, priceMax: price };
  const code = sale.enabled ? sale.code : "";

  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => undefined);
    toast.success(`Code ${code} copied`, { description: "Mention it when you enquire." });
  };
  const checkPin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pin = String(new FormData(e.currentTarget).get("pin") ?? "").trim();
    setPinMsg(/^[1-9]\d{5}$/.test(pin) ? { ok: true, text: `Delivers to ${pin} in 1–3 days.` } : { ok: false, text: "Enter a valid 6-digit PIN code." });
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl leading-snug font-extrabold text-foreground sm:text-3xl">{deal.name} | Refurbished</h1>
        <FavoriteButton productId={deal.id} className="shrink-0" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1 font-semibold">
          <Star className="size-4 fill-amber-400 text-amber-400" /> {deal.rating.toFixed(1)}
          <span className="font-normal text-muted-foreground">({deal.reviews} ratings)</span>
        </span>
        {!store && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">In stock</span>}
      </div>

      <motion.p key={price} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-black text-foreground">{formatPrice(price)}</span>
        <span className="text-muted-foreground line-through">{formatPrice(mrp)}</span>
        <span className="rounded-md bg-ember px-2 py-0.5 text-sm font-bold text-white">{discountPct({ price, mrp })}% OFF</span>
      </motion.p>
      <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes · Final price confirmed on enquiry</p>

      <div className="mt-6 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-border">
        <p className="text-sm font-bold text-navy">More configurations available</p>
        {groups.map((g, i) => (
          <Options key={g.name} label={g.name} values={g.values} value={picks[i] ?? 0} onChange={(v) => setPicks((p) => groups.map((_, j) => (j === i ? v : (p[j] ?? 0))))} />
        ))}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p className="rounded-xl bg-cream px-3 py-2 ring-1 ring-peach"><span className="block text-xs text-muted-foreground">Warranty</span><span className="font-semibold">Free 6 month</span></p>
          <p className="rounded-xl bg-cream px-3 py-2 ring-1 ring-peach"><span className="block text-xs text-muted-foreground">Condition</span><span className="font-semibold">Superb</span></p>
        </div>
      </div>

      {sale.enabled && (
        <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-amber-300">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-100 to-peach px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-extrabold text-navy">
              <Sparkles className="size-4 text-ember" /> {sale.title}
              {sale.discount && ` · up to ${sale.discount.toLowerCase()}`}
            </p>
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
          </div>
          {code && (
            <div className="flex items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
              <span className="text-xs">Use code</span>
              <button type="button" onClick={copy} className="flex items-center gap-2 rounded-lg border border-dashed border-white/60 px-3 py-1 text-sm font-bold tracking-widest transition hover:bg-white/10">
                {code} <Copy className="size-3.5" />
              </button>
              <span className="text-xs text-white/70">Extra ₹500 off on enquiry</span>
            </div>
          )}
        </div>
      )}

      <AddToCart deal={deal} options={Object.fromEntries(groups.map((g, i) => [g.name, g.values[picks[i] ?? 0]]))} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <LeadDialog product={product} className="h-12 rounded-xl bg-navy text-base hover:bg-navy-deep" />
        <WhatsAppButton product={product} className="h-12 rounded-xl" />
      </div>

      <div className="mt-6">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">
          <Truck className="size-4" /> Delivery details
        </p>
        <form onSubmit={checkPin} noValidate className="flex gap-2">
          <input
            name="pin"
            inputMode="numeric"
            maxLength={6}
            aria-label="PIN code"
            placeholder="Enter your PIN code"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-navy focus:ring-3 focus:ring-navy/15"
          />
          <button type="submit" className="h-11 rounded-xl bg-navy px-5 text-sm font-bold text-white transition hover:bg-navy-deep">
            Check
          </button>
        </form>
        {pinMsg && (
          <p role="status" className={`mt-2 text-sm font-semibold ${pinMsg.ok ? "text-emerald-700" : "text-rose-600"}`}>
            {pinMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
