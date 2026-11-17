"use client";

import { cn } from "@/lib/utils";
import type { ProductType } from "@/lib/site-content";
import { inputClass, Label } from "./fields";

// The part of the product form that comes from the chosen type: its spec fields and option groups.
export function ProductTypeFields({
  type,
  specs,
  options,
  error,
  onSpec,
  onOptions,
}: {
  type: ProductType;
  specs: Record<string, string>;
  options: Record<string, string[]>;
  error?: string;
  onSpec: (label: string, value: string) => void;
  onOptions: (group: string, values: string[]) => void;
}) {
  if (!type.specs.length && !type.options.length) {
    return <p className="text-sm text-muted-foreground">The {type.name} type has no spec fields or options. Add them in the Types tab.</p>;
  }
  return (
    <div className="space-y-5">
      {type.specs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {type.specs.map((label) => (
            <Label key={label} text={label}>
              <input value={specs[label] ?? ""} onChange={(e) => onSpec(label, e.target.value)} className={inputClass} />
            </Label>
          ))}
        </div>
      )}
      {type.options.map((g) => {
        const picked = options[g.name] ?? [];
        return (
          <fieldset key={g.name}>
            <legend className="mb-2 flex w-full items-baseline justify-between text-xs font-bold tracking-wide text-navy-deep uppercase">
              {g.name} this product comes in
              {g.step > 0 && <span className="font-medium tracking-normal text-muted-foreground normal-case">+₹{g.step.toLocaleString("en-IN")} per step up</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.values.map((v) => {
                const on = picked.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    // Kept in the type's order: the position decides the price step.
                    onClick={() => onOptions(g.name, g.values.filter((x) => (x === v ? !on : picked.includes(x))))}
                    className={cn("min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition", on ? "bg-navy text-white ring-navy" : "text-navy ring-border hover:bg-cream")}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {error && <p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}
