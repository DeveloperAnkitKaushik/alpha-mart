"use client";

import { memo, useState, type ReactNode } from "react";
import { ChevronLeft, ListPlus, Plus, Tag, Trash2, X } from "lucide-react";
import { uniqueSlug, type Deal, type OptionGroup, type ProductType } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, getDraft, move, removeAt, replaceAt, useDraft } from "./draft-store";
import { EditorCard, inputClass } from "./fields";

// Changes one type and, in the same edit, its products, so specs and options stay keyed by live names.
const editType = (id: string, fn: (t: ProductType) => ProductType, fixProduct?: (p: Deal) => Deal) =>
  editDraft((d) => ({
    ...d,
    types: d.types.map((t) => (t.id === id ? fn(t) : t)),
    products: fixProduct ? d.products.map((p) => (p.type === id ? fixProduct(p) : p)) : d.products,
  }));

function renameKey<V>(rec: Record<string, V>, from: string, to: string): Record<string, V> {
  // Renaming onto a name already in use would overwrite that value; publish blocks the duplicate instead.
  if (!(from in rec) || from === to || to in rec) return rec;
  const { [from]: value, ...rest } = rec;
  return { ...rest, [to]: value };
}
const dropKey = <V,>(rec: Record<string, V>, key: string) => Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));

// Products of a type matching a test, counted at click time without subscribing.
const countProducts = (pred: (p: Deal) => boolean) => getDraft()?.products.filter(pred).length ?? 0;

const iconBtn = "grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-border transition hover:bg-cream disabled:opacity-30";

// "Type a name, press Enter or click Add". Used for new types, spec fields, option groups and values.
function AddInline({ placeholder, label, button = "Add", onAdd }: { placeholder: string; label: string; button?: string; onAdd: (v: string) => boolean }) {
  const [v, setV] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const value = v.trim();
    if (!value) return;
    if (onAdd(value)) {
      setV("");
      setError("");
    } else setError(`“${value}” is already there.`);
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          className={cn(inputClass, "min-w-0 flex-1")}
        />
        <button type="button" onClick={submit} disabled={!v.trim()} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-bold text-white transition hover:bg-navy-deep disabled:opacity-40">
          <Plus className="size-4" /> {button}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-extrabold text-navy-deep">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function OptionGroupCard({ typeId, index, group }: { typeId: string; index: number; group: OptionGroup }) {
  const setGroup = (g: OptionGroup, fix?: (p: Deal) => Deal) => editType(typeId, (t) => ({ ...t, options: replaceAt(t.options, index, g) }), fix);
  const removeValue = (v: string) => {
    const n = countProducts((p) => p.type === typeId && (p.options[group.name] ?? []).includes(v));
    if (n && !confirm(`${n} product${n === 1 ? "" : "s"} offer ${v}. Remove it from them too?`)) return;
    setGroup({ ...group, values: group.values.filter((x) => x !== v) }, (p) => ({ ...p, options: { ...p.options, [group.name]: (p.options[group.name] ?? []).filter((x) => x !== v) } }));
  };
  const removeGroup = () => {
    if (confirm(`Remove “${group.name || "this option"}” from the type and its products?`))
      editType(typeId, (t) => ({ ...t, options: removeAt(t.options, index) }), (p) => ({ ...p, options: dropKey(p.options, group.name) }));
  };

  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={group.name}
          aria-label="Option name"
          placeholder="Option name, e.g. RAM"
          onChange={(e) => setGroup({ ...group, name: e.target.value }, (p) => ({ ...p, options: renameKey(p.options, group.name, e.target.value) }))}
          className={cn(inputClass, "min-w-40 flex-1 font-bold")}
        />
        <label className="flex h-11 items-center gap-1.5 rounded-xl bg-cream px-3 text-sm text-navy ring-1 ring-peach">
          +₹
          <input
            type="number"
            min={0}
            value={group.step}
            aria-label={`Extra price per step up for ${group.name || "this option"}`}
            onChange={(e) => setGroup({ ...group, step: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
            className="w-20 bg-transparent font-bold outline-none"
          />
          <span className="text-xs text-muted-foreground">per step</span>
        </label>
        <button type="button" onClick={removeGroup} aria-label={`Remove ${group.name || "option"}`} className={cn(iconBtn, "text-destructive hover:bg-destructive/10")}>
          <Trash2 className="size-4" />
        </button>
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-2">
        {group.values.map((v, i) => (
          <li key={v} className="inline-flex h-10 items-center gap-0.5 rounded-full bg-navy/5 pl-3.5 text-sm font-semibold text-navy ring-1 ring-navy/15">
            {v}
            <button type="button" aria-label={`Move ${v} earlier`} disabled={i === 0} onClick={() => setGroup({ ...group, values: move(group.values, i, -1) })} className="grid size-9 place-items-center rounded-full hover:bg-white disabled:hidden">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label={`Remove ${v}`} onClick={() => removeValue(v)} className="grid size-9 place-items-center rounded-full text-destructive hover:bg-white">
              <X className="size-4" />
            </button>
          </li>
        ))}
        {group.values.length === 0 && <li className="text-xs font-semibold text-amber-700">Add at least one value below.</li>}
      </ul>
      <div className="mt-3">
        <AddInline
          label={`New ${group.name || "option"} value`}
          placeholder={`Add a ${group.name || "value"}, e.g. 16 GB (cheapest first)`}
          onAdd={(v) => !group.values.includes(v) && (setGroup({ ...group, values: [...group.values, v] }), true)}
        />
      </div>
    </li>
  );
}

function TypeDetail({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const t = useDraft((s) => s.draft?.types.find((x) => x.id === id));
  const products = useDraft((s) => s.draft?.products.filter((p) => p.type === id).length ?? 0);
  if (!t) return null;

  const remove = () => {
    if (products) return alert(`${products} product${products === 1 ? " uses" : "s use"} ${t.name}. Change their type first.`);
    if (!confirm(`Delete the ${t.name || "new"} type?`)) return;
    editDraft((d) => ({ ...d, types: d.types.filter((x) => x.id !== id) }));
    onDeleted();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input value={t.name} aria-label="Type name" placeholder="Type name" onChange={(e) => editType(id, (x) => ({ ...x, name: e.target.value }))} className={cn(inputClass, "h-12 min-w-0 flex-1 text-lg font-extrabold text-navy-deep")} />
        <span className="rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-navy ring-1 ring-peach">
          {products} product{products === 1 ? "" : "s"}
        </span>
        <button type="button" onClick={remove} aria-label={`Delete ${t.name} type`} className={cn(iconBtn, "text-destructive hover:bg-destructive/10")}>
          <Trash2 className="size-4" />
        </button>
      </div>

      <Section title="Spec fields" hint="Text you fill in for each product, like Processor or Screen. The first three show on product cards.">
        {t.specs.length > 0 ? (
          <ol className="grid gap-2 sm:grid-cols-2">
            {t.specs.map((label, i) => (
              // Position key: renaming in place must not remount the input mid-typing.
              <li key={i} className="flex gap-2">
                <input
                  value={label}
                  aria-label={`Spec field ${i + 1}`}
                  onChange={(e) => editType(id, (x) => ({ ...x, specs: replaceAt(x.specs, i, e.target.value) }), (p) => ({ ...p, specs: renameKey(p.specs, label, e.target.value) }))}
                  className={inputClass}
                />
                <button type="button" aria-label={`Move ${label} earlier`} disabled={i === 0} onClick={() => editType(id, (x) => ({ ...x, specs: move(x.specs, i, -1) }))} className={cn(iconBtn, "text-navy")}>
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => editType(id, (x) => ({ ...x, specs: removeAt(x.specs, i) }), (p) => ({ ...p, specs: dropKey(p.specs, label) }))}
                  className={cn(iconBtn, "text-destructive hover:bg-destructive/10")}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl bg-cream/60 px-3 py-2 text-sm text-muted-foreground">No spec fields yet.</p>
        )}
        <AddInline label="New spec field" placeholder="e.g. Processor, Screen, Graphics" button="Add field" onAdd={(v) => !t.specs.includes(v) && (editType(id, (x) => ({ ...x, specs: [...x.specs, v] })), true)} />
      </Section>

      <Section title="Buyer options" hint="Choices on the product page, like RAM or Storage. A product's base price is for the cheapest value it offers; each step up from there adds the option's price.">
        {t.options.length > 0 ? (
          <ul className="space-y-3">
            {t.options.map((g, i) => (
              <OptionGroupCard key={i} typeId={id} index={i} group={g} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-cream/60 px-3 py-2 text-sm text-muted-foreground">No options yet. Products of this type will have one fixed configuration.</p>
        )}
        <AddInline label="New option" placeholder="e.g. RAM, Storage, Colour" button="Add option" onAdd={(name) => !t.options.some((g) => g.name === name) && (editType(id, (x) => ({ ...x, options: [...x.options, { name, step: 0, values: [] }] })), true)} />
      </Section>
    </div>
  );
}

const TypeListItem = memo(function TypeListItem({ id, active, onSelect }: { id: string; active: boolean; onSelect: (id: string) => void }) {
  const name = useDraft((s) => s.draft?.types.find((t) => t.id === id)?.name ?? "");
  const count = useDraft((s) => s.draft?.products.filter((p) => p.type === id).length ?? 0);
  return (
    <li>
      <button
        type="button"
        aria-current={active}
        onClick={() => onSelect(id)}
        className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition", active ? "bg-navy text-white shadow-md" : "text-navy hover:bg-cream")}
      >
        <Tag className="size-4 shrink-0 opacity-70" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{name || "Untitled type"}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", active ? "bg-white/20" : "bg-cream")}>{count}</span>
      </button>
    </li>
  );
});

export function TypesEditor() {
  const ids = useDraft((s) => s.draft?.types.map((t) => t.id).join("|") ?? "");
  const list = ids ? ids.split("|") : [];
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && list.includes(picked) ? picked : (list[0] ?? null);

  const add = (name: string) => {
    const d = getDraft();
    if (!d || d.types.some((t) => t.name.toLowerCase() === name.toLowerCase())) return false;
    const id = uniqueSlug(name, d.types.map((t) => t.id), "type");
    editDraft((c) => ({ ...c, types: [...c.types, { id, name, specs: [], options: [] }] }));
    setPicked(id);
    return true;
  };

  return (
    <EditorCard title="Product types" sub="A type decides what you fill in for a product (spec fields) and what buyers can choose (options).">
      <div className="grid gap-5 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="space-y-3 md:border-r md:border-border md:pr-5">
          <ul className="space-y-1">
            {list.map((id) => (
              <TypeListItem key={id} id={id} active={id === selected} onSelect={setPicked} />
            ))}
          </ul>
          <div className="rounded-xl bg-cream/60 p-3 ring-1 ring-peach">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-navy-deep uppercase">
              <ListPlus className="size-4" aria-hidden /> New type
            </p>
            <AddInline label="New type name" placeholder="e.g. Monitor" button="Create" onAdd={add} />
          </div>
        </aside>
        {selected ? (
          <TypeDetail key={selected} id={selected} onDeleted={() => setPicked(null)} />
        ) : (
          <p className="grid place-items-center rounded-2xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">Create your first type on the left.</p>
        )}
      </div>
    </EditorCard>
  );
}
