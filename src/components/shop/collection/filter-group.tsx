"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title: string;
  options: { value: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || selected.length > 0);
  return (
    <div className="border-b border-border py-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-sm font-bold text-navy">
        {title}
        <span className={`grid size-6 place-items-center rounded-full ring-1 ring-border transition ${open ? "rotate-180 bg-navy text-white ring-navy" : ""}`}>
          <ChevronDown className="size-3.5" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {options.map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-foreground/80 hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.value)}
                    onChange={() => onToggle(o.value)}
                    className="size-4 rounded accent-navy"
                  />
                  <span className="flex-1">{o.value}</span>
                  <span className="text-xs text-muted-foreground">({o.count})</span>
                </label>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
