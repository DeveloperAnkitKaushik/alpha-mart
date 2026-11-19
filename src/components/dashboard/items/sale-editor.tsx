"use client";

import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useStoreEnabled } from "@/components/store/store-flag";
import { couponExists } from "@/lib/store/admin-actions";
import { SALE_LAYOUTS, type Sale } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, useDraft } from "./draft-store";
import { EditorCard, inputClass, Label, Toggle } from "./fields";

const LAYOUTS: Record<Sale["layout"], { name: string; sketch: string[] }> = {
  spotlight: { name: "Spotlight", sketch: ["h-6", "h-2", "h-4"] },
  compact: { name: "Compact bar", sketch: ["h-3", "h-6"] },
  products: { name: "Products only", sketch: ["h-2", "h-10"] },
};
const HELP: Record<Sale["layout"], string> = {
  spotlight: "Big banner with countdown, code and perks, then 5 sale products.",
  compact: "One slim bar with countdown and code, then a scrolling row of sale products.",
  products: "A heading with countdown above a grid of up to 8 sale products.",
};

const update = (patch: Partial<Sale>) => editDraft((d) => ({ ...d, sale: { ...d.sale, ...patch } }));

// en-CA formats as YYYY-MM-DD in the admin's own timezone.
const today = () => new Date().toLocaleDateString("en-CA");

function MissingCouponWarning({ code }: { code: string }) {
  const { data: exists } = useQuery({ queryKey: ["coupon-exists", code], queryFn: () => couponExists(code), retry: false });
  if (exists !== false) return null;
  return (
    <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
      No active coupon named {code}. Customers will be told it&apos;s invalid at checkout. Create it under Coupons.
    </p>
  );
}

export function SaleEditor() {
  const store = useStoreEnabled();
  const sale = useDraft((s) => s.draft?.sale);
  const onSale = useDraft(useShallow((s) => ({ on: s.draft?.products.filter((p) => p.onSale).length ?? 0, total: s.draft?.products.length ?? 0 })));
  if (!sale) return null;
  const pastEnd = sale.endsAt !== "" && sale.endsAt <= today();

  return (
    <EditorCard title="Sale section" sub="The sale block under the stats strip on the home page." action={<Toggle checked={sale.enabled} onChange={(enabled) => update({ enabled })} label={sale.enabled ? "Sale on" : "Sale off"} />}>
      <fieldset disabled={!sale.enabled} className="space-y-5 disabled:opacity-50">
        <div>
          <p className="mb-2 text-xs font-bold tracking-wide text-navy-deep uppercase">Layout</p>
          <div role="radiogroup" aria-label="Sale layout" className="grid gap-3 sm:grid-cols-3">
            {SALE_LAYOUTS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={sale.layout === l}
                onClick={() => update({ layout: l })}
                className={cn("rounded-2xl p-3 text-left ring-2 transition", sale.layout === l ? "bg-peach/30 ring-ember" : "ring-border hover:ring-navy/40")}
              >
                <span className="mb-2 block space-y-1 rounded-lg bg-cream p-2" aria-hidden>
                  {LAYOUTS[l].sketch.map((h, i) => (
                    <span key={i} className={cn("block rounded bg-navy/20", h)} />
                  ))}
                </span>
                <span className="block text-sm font-bold text-navy">{LAYOUTS[l].name}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{HELP[sale.layout]}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Title">
            <input value={sale.title} onChange={(e) => update({ title: e.target.value })} className={inputClass} />
          </Label>
          <Label text="Small line above title" hint="optional">
            <input value={sale.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} className={inputClass} />
          </Label>
          <Label text="Discount badge" hint="e.g. 70% OFF · optional">
            <input value={sale.discount} onChange={(e) => update({ discount: e.target.value })} className={inputClass} />
          </Label>
          <Label text="Coupon code" hint="optional">
            <input value={sale.code} onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} className={inputClass} />
          </Label>
          <Label text="Sale ends on" hint="empty = end of every month">
            <span className="flex gap-2">
              <input type="date" value={sale.endsAt} min={today()} onChange={(e) => update({ endsAt: e.target.value })} className={inputClass} />
              {sale.endsAt && (
                <button type="button" onClick={() => update({ endsAt: "" })} className="h-11 rounded-xl px-3 text-sm font-semibold text-navy ring-1 ring-border hover:bg-cream">
                  Clear
                </button>
              )}
            </span>
          </Label>
        </div>
        {store && sale.enabled && sale.code && <MissingCouponWarning code={sale.code} />}
        {pastEnd && <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">This date has passed, so the sale won&apos;t show. Pick a later date or clear it.</p>}
        <p className="rounded-xl bg-cream px-3 py-2 text-sm text-navy">
          <strong>{onSale.on}</strong> of {onSale.total} products are marked <em>On sale</em>. Change this in the Products tab.
          {onSale.on === 0 && (sale.layout === "products" ? " With none marked, this layout shows nothing." : " With none marked, only the banner shows.")}
        </p>
      </fieldset>
    </EditorCard>
  );
}
