"use client";

import { Plus } from "lucide-react";
import { STAT_ICON } from "@/components/shop/trust-strip";
import { STAT_ICONS, type Stat } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { editDraft, move, removeAt, replaceAt, useDraft } from "./draft-store";
import { addBtn, EditorCard, EmptyRow, inputClass, Label, RowActions } from "./fields";

const MAX = 4;

const update = (i: number, patch: Partial<Stat>) =>
  editDraft((d) => ({ ...d, stats: replaceAt(d.stats, i, { ...d.stats[i], ...patch }) }));

function StatRow({ index, count }: { index: number; count: number }) {
  const s = useDraft((st) => st.draft?.stats[index]);
  if (!s) return null;
  return (
    <li className="rounded-2xl p-4 ring-1 ring-border">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={`Icon for stat ${index + 1}`} className="flex flex-wrap gap-1.5">
          {STAT_ICONS.map((key) => {
            const Icon = STAT_ICON[key];
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={s.icon === key}
                aria-label={key}
                onClick={() => update(index, { icon: key })}
                className={cn("grid size-11 place-items-center rounded-xl ring-1 transition", s.icon === key ? "bg-navy text-white ring-navy" : "text-navy ring-border hover:bg-cream")}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </div>
        <RowActions
          index={index}
          count={count}
          name={`stat ${index + 1}`}
          onMove={(dir) => editDraft((d) => ({ ...d, stats: move(d.stats, index, dir) }))}
          onDelete={() => editDraft((d) => ({ ...d, stats: removeAt(d.stats, index) }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem_6rem_8rem]">
        <Label text="Label">
          <input value={s.label} onChange={(e) => update(index, { label: e.target.value })} className={inputClass} />
        </Label>
        <Label text="Number">
          <input
            type="number"
            min={0}
            step="any"
            value={Number.isFinite(s.value) ? s.value : ""}
            onChange={(e) => update(index, { value: e.target.value === "" ? 0 : Number(e.target.value) })}
            className={inputClass}
          />
        </Label>
        <Label text="Decimals">
          <select value={s.decimals} onChange={(e) => update(index, { decimals: Number(e.target.value) })} className={inputClass}>
            {[0, 1, 2].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Label>
        <Label text="After number" hint="e.g. +">
          <input value={s.suffix} onChange={(e) => update(index, { suffix: e.target.value })} className={inputClass} />
        </Label>
      </div>
    </li>
  );
}

export function StatsEditor() {
  const count = useDraft((s) => s.draft?.stats.length ?? 0);
  const add = () => editDraft((d) => ({ ...d, stats: [...d.stats, { icon: "star", value: 100, decimals: 0, suffix: "+", label: "New stat" }] }));
  return (
    <EditorCard
      title="Stats strip"
      sub="The numbers right under the hero banner. Up to 4."
      action={
        <button type="button" onClick={add} disabled={count >= MAX} className={addBtn}>
          <Plus className="size-4" /> Add stat
        </button>
      }
    >
      {count === 0 ? (
        <EmptyRow>No stats. The strip is hidden on the home page.</EmptyRow>
      ) : (
        <ol className="space-y-4">
          {/* Rows hold no local state (every input reads the draft), so position keys are safe here. */}
          {Array.from({ length: count }, (_, i) => (
            <StatRow key={i} index={i} count={count} />
          ))}
        </ol>
      )}
    </EditorCard>
  );
}
