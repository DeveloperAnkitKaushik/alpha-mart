"use client";

import { memo, useDeferredValue, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { formatPrice } from "@/lib/data";
import { discountPct } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, useDraft } from "./draft-store";
import { addBtn, EditorCard, EmptyRow, inputClass, Toggle } from "./fields";
import { ProductDialog } from "./product-dialog";

const ProductRow = memo(function ProductRow({ id, onEdit }: { id: string; onEdit: (id: string) => void }) {
  const p = useDraft((s) => s.draft?.products.find((x) => x.id === id));
  const typeName = useDraft((s) => (p ? s.draft?.types.find((t) => t.id === p.type)?.name : undefined));
  if (!p) return null;
  const remove = () => {
    if (confirm(`Delete "${p.name}"? Its page will stop working. Past enquiries keep their record.`))
      editDraft((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) }));
  };
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl p-3 ring-1 ring-border sm:flex-nowrap">
      <ShopImage src={p.images[0]} className="aspect-[4/3] w-20 shrink-0 rounded-lg ring-1 ring-border" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-navy-deep">{p.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {typeName ?? <span className="font-semibold text-destructive">no type</span>} · <span className="font-bold text-foreground">{formatPrice(p.price)}</span> <span className="line-through">{formatPrice(p.mrp)}</span> · {discountPct(p)}% off · {p.images.length} photo{p.images.length === 1 ? "" : "s"} ·{" "}
          {p.categories.length ? `${p.categories.length} categor${p.categories.length === 1 ? "y" : "ies"}` : <span className="font-semibold text-amber-700">no category</span>}
        </p>
      </div>
      <Toggle checked={p.onSale} onChange={(onSale) => editDraft((d) => ({ ...d, products: d.products.map((x) => (x.id === id ? { ...x, onSale } : x)) }))} label="On sale" />
      <button type="button" aria-label={`Edit ${p.name}`} onClick={() => onEdit(id)} className="grid size-11 place-items-center rounded-xl text-navy ring-1 ring-border hover:bg-cream">
        <Pencil className="size-4" />
      </button>
      <button type="button" aria-label={`Delete ${p.name}`} onClick={remove} className="grid size-11 place-items-center rounded-xl text-destructive ring-1 ring-border hover:bg-destructive/10">
        <Trash2 className="size-4" />
      </button>
    </li>
  );
});

export function ProductsEditor() {
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const q = useDeferredValue(term.trim().toLowerCase());
  const total = useDraft((s) => s.draft?.products.length ?? 0);
  const ids = useDraft((s) =>
    (s.draft?.products ?? [])
      .filter((p) => !q || `${p.name} ${p.tag} ${p.id}`.toLowerCase().includes(q))
      .map((p) => p.id)
      .join("|"),
  );
  const shown = ids ? ids.split("|") : [];

  return (
    <EditorCard
      title="Products"
      sub="Everything listed on the site. “On sale” products appear in the sale section."
      action={
        <button type="button" onClick={() => setEditing("new")} className={addBtn}>
          <Plus className="size-4" /> Add product
        </button>
      }
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`Search ${total} products`} aria-label="Search products" className={cn(inputClass, "pl-9")} />
      </div>
      {shown.length === 0 ? (
        <EmptyRow>{total ? "No products match your search." : "No products yet. Add your first one."}</EmptyRow>
      ) : (
        <ul className="space-y-2">
          {shown.map((id) => (
            <ProductRow key={id} id={id} onEdit={setEditing} />
          ))}
        </ul>
      )}
      {editing && <ProductDialog key={editing} id={editing} onClose={() => setEditing(null)} />}
    </EditorCard>
  );
}
