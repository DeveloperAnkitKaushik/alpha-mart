"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { ALL_COLLECTION, uniqueSlug, type Category } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, move, removeAt, useDraft } from "./draft-store";
import { addBtn, EditorCard, EmptyRow, inputClass, Label, RowActions } from "./fields";
import { ImageField } from "./image-field";

const MAX = 24;

// By slug, not index: an image upload can finish after the admin has reordered the rows.
const update = (slug: string, patch: Partial<Category>) =>
  editDraft((d) => ({ ...d, categories: d.categories.map((c) => (c.slug === slug ? { ...c, ...patch } : c)) }));

const CategoryRow = memo(function CategoryRow({ index, count }: { index: number; count: number }) {
  const c = useDraft((s) => s.draft?.categories[index]);
  const products = useDraft((s) => (c ? (s.draft?.products.filter((p) => p.categories.includes(c.slug)).length ?? 0) : 0));
  if (!c) return null;

  const remove = () => {
    const note = `${products ? ` It will be removed from ${products} product${products === 1 ? "" : "s"}; the products stay.` : ""} Links to /collections/${c.slug} will stop working.`;
    if (!confirm(`Delete the "${c.label}" category?${note}`)) return;
    editDraft((d) => ({
      ...d,
      categories: removeAt(d.categories, index),
      products: d.products.map((p) => (p.categories.includes(c.slug) ? { ...p, categories: p.categories.filter((x) => x !== c.slug) } : p)),
    }));
  };

  return (
    <li className="grid gap-4 rounded-2xl p-4 ring-1 ring-border lg:grid-cols-[minmax(0,22rem)_1fr]">
      <Label text="Thumbnail">
        <ImageField value={c.image} aspect="aspect-[4/5]" label="Thumbnail" onChange={(image) => update(c.slug, { image })} onClear={() => update(c.slug, { image: "" })} />
      </Label>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-black text-white">{index + 1}</span>
            <Link href={`/collections/${c.slug}`} target="_blank" className="inline-flex items-center gap-1 font-mono text-xs hover:text-navy">
              /collections/{c.slug} <ExternalLink className="size-3" />
            </Link>
            · {products} product{products === 1 ? "" : "s"}
          </p>
          <RowActions index={index} count={count} name={c.label || "category"} onMove={(dir) => editDraft((d) => ({ ...d, categories: move(d.categories, index, dir) }))} onDelete={remove} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Name">
            <input value={c.label} onChange={(e) => update(c.slug, { label: e.target.value })} className={inputClass} />
          </Label>
          <Label text="Image fit">
            <div role="radiogroup" aria-label="Image fit" className="grid grid-cols-2 gap-2">
              {(["contain", "cover"] as const).map((fit) => (
                <button
                  key={fit}
                  type="button"
                  role="radio"
                  aria-checked={c.fit === fit}
                  onClick={() => update(c.slug, { fit })}
                  className={cn("h-11 rounded-xl text-sm font-semibold ring-1 transition", c.fit === fit ? "bg-navy text-white ring-navy" : "text-navy ring-border hover:bg-cream")}
                >
                  {fit === "contain" ? "Show whole image" : "Fill the frame"}
                </button>
              ))}
            </div>
          </Label>
        </div>
        <Label text="Page heading" hint="empty = use the name">
          <input value={c.title} onChange={(e) => update(c.slug, { title: e.target.value })} className={inputClass} />
        </Label>
        <Label text="Page intro" hint="optional">
          <textarea value={c.intro} rows={2} onChange={(e) => update(c.slug, { intro: e.target.value })} className={cn(inputClass, "h-auto py-2")} />
        </Label>
      </div>
    </li>
  );
});

export function CategoriesEditor() {
  const slugs = useDraft((s) => s.draft?.categories.map((c) => c.slug).join("|") ?? "");
  const count = slugs ? slugs.split("|").length : 0;
  const [name, setName] = useState("");

  const add = () => {
    const label = name.trim();
    if (!label) return;
    editDraft((d) => {
      const slug = uniqueSlug(label, [ALL_COLLECTION.slug, ...d.categories.map((c) => c.slug)], "category");
      return { ...d, categories: [...d.categories, { slug, label, title: "", intro: "", image: "", fit: "contain" }] };
    });
    setName("");
  };

  return (
    <EditorCard title="Categories" sub="Shown as “Shop by Category” on the home page, in the menu, and as collection pages. Assign products in the Products tab.">
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New category name, e.g. Workstations"
          aria-label="New category name"
          className={cn(inputClass, "min-w-0 flex-1")}
        />
        <button type="button" onClick={add} disabled={!name.trim() || count >= MAX} className={addBtn}>
          <Plus className="size-4" /> Create category
        </button>
      </div>
      {count === 0 ? (
        <EmptyRow>No categories yet. “Shop by Category” is hidden until you add one.</EmptyRow>
      ) : (
        <ol className="space-y-4">
          {slugs.split("|").map((slug, i) => (
            <CategoryRow key={slug} index={i} count={count} />
          ))}
        </ol>
      )}
    </EditorCard>
  );
}
