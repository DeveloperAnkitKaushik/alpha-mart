"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { offeredOptions, productSchema, uniqueSlug, type Deal, type ProductType } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, getDraft } from "./draft-store";
import { inputClass, Label, Toggle } from "./fields";
import { ProductPhotos } from "./product-photos";
import { ProductTypeFields } from "./product-type-fields";

type NumKey = "price" | "mrp" | "rating" | "reviews";
type Form = Omit<Deal, NumKey | "id"> & Record<NumKey, string>;

const toForm = (d: Deal): Form => ({ ...d, price: String(d.price), mrp: String(d.mrp), rating: String(d.rating), reviews: String(d.reviews) });

// A new product starts on the first type with the cheapest value of every option group picked.
const blank = (t: ProductType | undefined): Form => ({
  type: t?.id ?? "",
  tag: "",
  name: "",
  specs: {},
  options: Object.fromEntries((t?.options ?? []).map((g) => [g.name, g.values.slice(0, 1)])),
  rating: "4.5",
  reviews: "0",
  price: "",
  mrp: "",
  images: [],
  categories: [],
  onSale: false,
});

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

// Keeps only the specs and option values the chosen type defines, so switching type leaves no stray data.
function fitToType(f: Form, t: ProductType): Pick<Deal, "specs" | "options"> {
  return {
    specs: Object.fromEntries(t.specs.map((l) => [l, f.specs[l]?.trim() ?? ""])),
    options: Object.fromEntries(t.options.map((g) => [g.name, g.values.filter((v) => f.options[g.name]?.includes(v))])),
  };
}

export function ProductDialog({ id, onClose }: { id: string | "new"; onClose: () => void }) {
  const draft = getDraft();
  const types = draft?.types ?? [];
  const categories = draft?.categories ?? [];
  const [form, setForm] = useState<Form>(() => {
    const existing = id === "new" ? undefined : draft?.products.find((p) => p.id === id);
    return existing ? toForm(existing) : blank(types[0]);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const type = types.find((t) => t.id === form.type);

  // Keeps values that still fit the new type; groups left empty get their cheapest value.
  const switchType = (typeId: string) => {
    const t = types.find((x) => x.id === typeId);
    setForm((f) => ({
      ...f,
      type: typeId,
      options: Object.fromEntries(
        (t?.options ?? []).map((g) => {
          const kept = g.values.filter((v) => f.options[g.name]?.includes(v));
          return [g.name, kept.length ? kept : g.values.slice(0, 1)];
        }),
      ),
    }));
  };

  const save = () => {
    const d = getDraft();
    if (!d) return;
    if (!type) return setErrors({ type: "Pick a product type" });
    const missing = type.options.find((g) => !form.options[g.name]?.some((v) => g.values.includes(v)));
    const isNew = id === "new";
    const parsed = productSchema.safeParse({
      ...form,
      ...fitToType(form, type),
      id: isNew ? uniqueSlug(form.name, d.products.map((p) => p.id), "product") : id,
      price: num(form.price),
      mrp: num(form.mrp),
      rating: num(form.rating),
      reviews: num(form.reviews),
    });
    const out: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) out[String(i.path[0])] ??= i.code === "invalid_type" ? "Enter a number" : i.message;
    if (missing) out.typeFields = `Pick at least one ${missing.name} option`;
    const top = parsed.success ? offeredOptions(type, parsed.data).reduce((sum, g) => sum + (g.values.length - 1) * g.step, parsed.data.price) : 0;
    if (parsed.success && top > parsed.data.mrp) out.mrp = `Top configuration costs ₹${top.toLocaleString("en-IN")}; MRP must be at least that.`;
    setErrors(out);
    if (!parsed.success || Object.keys(out).length) return;
    const deal = parsed.data;
    editDraft((c) => ({ ...c, products: isNew ? [...c.products, deal] : c.products.map((p) => (p.id === id ? deal : p)) }));
    onClose();
  };

  const field = (key: NumKey | "name" | "tag", label: string, hint?: string, numeric = false) => (
    <Label text={label} hint={hint}>
      <input
        type={numeric ? "number" : "text"}
        inputMode={numeric ? "decimal" : undefined}
        value={form[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        aria-invalid={errors[key] ? true : undefined}
        className={inputClass}
      />
      {errors[key] && <span role="alert" className="block text-xs font-semibold text-destructive">{errors[key]}</span>}
    </Label>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-navy-deep">{id === "new" ? "New product" : "Edit product"}</DialogTitle>
          <DialogDescription>{id === "new" ? "It's added to the end of the catalogue." : <span className="font-mono text-xs">/product/{id}</span>}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {field("name", "Name", "shown on cards and the product page")}
          <div className="grid gap-4 sm:grid-cols-3">
            <Label text="Type">
              <select value={form.type} onChange={(e) => switchType(e.target.value)} aria-invalid={errors.type ? true : undefined} className={inputClass}>
                {!type && <option value="">Pick a type…</option>}
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.type && <span role="alert" className="block text-xs font-semibold text-destructive">{errors.type}</span>}
            </Label>
            {field("tag", "Best for", "e.g. OFFICE USE")}
            <div className="flex items-end">
              <Toggle checked={form.onSale} onChange={(onSale) => set({ onSale })} label="On sale" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {field("price", "Base price ₹", undefined, true)}
            {field("mrp", "MRP ₹", undefined, true)}
            {field("rating", "Rating", "0–5", true)}
            {field("reviews", "Reviews", undefined, true)}
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold tracking-wide text-navy-deep uppercase">Categories</legend>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Create them in the Categories tab.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = form.categories.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ categories: on ? form.categories.filter((x) => x !== c.slug) : [...form.categories, c.slug] })}
                      className={cn("min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition", on ? "bg-navy text-white ring-navy" : "text-navy ring-border hover:bg-cream")}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          <ProductPhotos images={form.images} onChange={(update) => setForm((f) => ({ ...f, images: update(f.images) }))} />

          {type ? (
            <section className="rounded-2xl bg-cream/60 p-4 ring-1 ring-peach">
              <h3 className="mb-4 text-sm font-extrabold text-navy-deep">{type.name} details</h3>
              <ProductTypeFields
                type={type}
                specs={form.specs}
                options={form.options}
                error={errors.typeFields}
                onSpec={(label, value) => setForm((f) => ({ ...f, specs: { ...f.specs, [label]: value } }))}
                onOptions={(group, values) => setForm((f) => ({ ...f, options: { ...f.options, [group]: values } }))}
              />
            </section>
          ) : (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Pick a type to fill in its specs and options.</p>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-sm font-bold text-navy ring-1 ring-border hover:bg-cream">
            Cancel
          </button>
          <button type="button" onClick={save} className="h-11 rounded-full bg-navy px-6 text-sm font-bold text-white hover:bg-navy-deep">
            {id === "new" ? "Add product" : "Save changes"}
          </button>
        </div>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-right text-xs font-semibold text-destructive">Fix the highlighted fields above.</p>}
      </DialogContent>
    </Dialog>
  );
}
