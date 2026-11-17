"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import type { Banner } from "@/lib/site-content";
import { editDraft, move, removeAt, useDraft } from "./draft-store";
import { addBtn, EditorCard, EmptyRow, inputClass, Label, RowActions, Toggle } from "./fields";
import { ImageField } from "./image-field";

const MAX = 10;

// By id, not index: an image upload can finish after the admin has reordered the rows.
const update = (id: string, patch: Partial<Banner>) =>
  editDraft((d) => ({ ...d, banners: d.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));

const BannerRow = memo(function BannerRow({ index, count }: { index: number; count: number }) {
  const b = useDraft((s) => s.draft?.banners[index]);
  if (!b) return null;
  const name = `banner ${index + 1}`;
  return (
    <li className="rounded-2xl p-4 ring-1 ring-border">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-black text-white">{index + 1}</span>
          <Toggle checked={b.enabled} onChange={(enabled) => update(b.id, { enabled })} label={b.enabled ? "Showing" : "Hidden"} />
        </div>
        <RowActions
          index={index}
          count={count}
          name={name}
          onMove={(dir) => editDraft((d) => ({ ...d, banners: move(d.banners, index, dir) }))}
          onDelete={() => {
            if (confirm(`Delete ${name}?`)) editDraft((d) => ({ ...d, banners: removeAt(d.banners, index) }));
          }}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Label text="Desktop image" hint="1440 × 503">
          <ImageField value={b.desktop} aspect="aspect-[1440/503]" label="Desktop image" onChange={(desktop) => update(b.id, { desktop })} />
        </Label>
        <Label text="Mobile image" hint="768 × 1365 · optional">
          <ImageField value={b.mobile} aspect="aspect-[768/1365]" label="Mobile image" onChange={(mobile) => update(b.id, { mobile })} onClear={() => update(b.id, { mobile: "" })} />
        </Label>
        <Label text="Link" hint="/collections/laptops, #deals or https://">
          <input value={b.href} onChange={(e) => update(b.id, { href: e.target.value })} className={inputClass} />
        </Label>
        <Label text="Description" hint="read out by screen readers">
          <input value={b.alt} onChange={(e) => update(b.id, { alt: e.target.value })} className={inputClass} />
        </Label>
      </div>
    </li>
  );
});

export function BannersEditor() {
  const count = useDraft((s) => s.draft?.banners.length ?? 0);
  // Row keys follow the banner ids so a moved row keeps its own image-field state.
  const ids = useDraft((s) => s.draft?.banners.map((b) => b.id).join("|") ?? "");
  const add = () =>
    editDraft((d) => ({
      ...d,
      banners: [...d.banners, { id: crypto.randomUUID(), desktop: "/posters/banner-1-desktop.jpg", mobile: "", href: "#deals", alt: "New banner", enabled: false }],
    }));

  return (
    <EditorCard
      title="Hero banners"
      sub="Shown at the top of the home page in this order. Hidden banners stay saved but don't show."
      action={
        <button type="button" onClick={add} disabled={count >= MAX} className={addBtn}>
          <Plus className="size-4" /> Add banner
        </button>
      }
    >
      {count === 0 ? (
        <EmptyRow>No banners. The home page starts with the stats strip.</EmptyRow>
      ) : (
        <ol className="space-y-4">
          {ids.split("|").map((id, i) => (
            <BannerRow key={id} index={i} count={count} />
          ))}
        </ol>
      )}
    </EditorCard>
  );
}
