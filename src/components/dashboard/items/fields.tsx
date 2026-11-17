"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function Label({ text, hint, children, className }: { text: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-baseline justify-between gap-2 text-xs font-bold tracking-wide text-navy-deep uppercase">
        {text}
        {hint && <span className="font-medium tracking-normal text-muted-foreground normal-case">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-2.5 text-sm font-semibold text-navy"
    >
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-emerald-600" : "bg-muted-foreground/30")}>
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", checked && "translate-x-5")} />
      </span>
      {label}
    </button>
  );
}

const iconBtn =
  "grid size-11 place-items-center rounded-xl text-navy ring-1 ring-border transition hover:bg-cream disabled:pointer-events-none disabled:opacity-30";

// Up / down / delete controls for one row of an ordered list.
export function RowActions({ index, count, name, onMove, onDelete }: { index: number; count: number; name: string; onMove: (dir: -1 | 1) => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1.5">
      <button type="button" aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(-1)} className={iconBtn}>
        <ArrowUp className="size-4" />
      </button>
      <button type="button" aria-label={`Move ${name} down`} disabled={index === count - 1} onClick={() => onMove(1)} className={iconBtn}>
        <ArrowDown className="size-4" />
      </button>
      <button type="button" aria-label={`Delete ${name}`} onClick={onDelete} className={cn(iconBtn, "text-destructive hover:bg-destructive/10")}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function EditorCard({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-border sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-navy-deep">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export const addBtn =
  "inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white transition hover:bg-navy-deep disabled:opacity-40";

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

// Splits "8 GB, 16 GB" into trimmed, non-empty items.
export const splitList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
