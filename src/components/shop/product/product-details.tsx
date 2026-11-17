"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Cpu, Gauge, HardDrive, Monitor, Power, Usb, Keyboard, Sparkles } from "lucide-react";
import type { Deal } from "@/lib/shop-data";
import { findType, offeredOptions } from "@/lib/site-content";
import { useSiteContent } from "@/components/site/site-content";

const SAMPLE = <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800">SAMPLE REPORT</span>;

const METRICS = [
  { label: "Startup time", avg: 34, unit: "sec" },
  { label: "Excel recalculation", avg: 99, unit: "sec" },
  { label: "Restart time", avg: 48, unit: "sec" },
  { label: "File transfer (5 GB)", avg: 70, unit: "sec" },
  { label: "Tab switching", avg: 900, unit: "ms" },
  { label: "Thermal under load", avg: 92, unit: "°C" },
];

const QC = [
  { icon: Gauge, title: "Performance", items: ["CPU stress test", "Memory test", "Benchmark within range"] },
  { icon: Power, title: "Power", items: ["Battery health checked", "Charging port", "Adapter output"] },
  { icon: Usb, title: "Connectivity", items: ["Wi-Fi and Bluetooth", "USB ports", "HDMI output"] },
  { icon: Monitor, title: "Display", items: ["Dead pixel scan", "Brightness levels", "Hinge tension"] },
  { icon: Keyboard, title: "Input", items: ["Every key tested", "Trackpad gestures", "Webcam and mic"] },
  { icon: Sparkles, title: "Aesthetics", items: ["Body graded", "Deep cleaned", "Fresh OS install"] },
];

const seed = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function TestedFor({ deal }: { deal: Deal }) {
  const h = seed(deal.id);
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-border sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy">Tested for {deal.tag.toLowerCase()}</h2>
          <p className="text-sm text-muted-foreground">How this device compares with the average in its category</p>
        </div>
        {SAMPLE}
      </div>
      <div className="mt-5 flex gap-5 text-xs font-semibold">
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-zinc-300" /> Category average</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-navy" /> This device</span>
      </div>
      <ul className="mt-5 space-y-4">
        {METRICS.map((m, i) => {
          const ratio = 0.55 + (((h >> (i * 3)) % 30) / 100);
          const value = Math.round(m.avg * ratio);
          return (
            <li key={m.label} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[12rem_1fr_6rem]">
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="space-y-1">
                <span className="block h-2 rounded-full bg-zinc-200"><span className="block h-full w-full rounded-full bg-zinc-300" /></span>
                <span className="block h-2 rounded-full bg-sky-100">
                  <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: `${ratio * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.08 }}
                    className="block h-full rounded-full bg-navy"
                  />
                </span>
              </span>
              <span className="text-right text-sm font-bold text-emerald-700">{Math.round((1 - ratio) * 100)}% better</span>
              <span className="text-xs text-muted-foreground sm:col-start-2">
                {value} {m.unit} vs {m.avg} {m.unit}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Specs({ deal }: { deal: Deal }) {
  const type = findType(useSiteContent().types, deal);
  const tabs = {
    Specifications: [
      ...(type?.specs ?? []).filter((l) => deal.specs[l]?.trim()).map((l) => [l, deal.specs[l]]),
      ...offeredOptions(type, deal).map((g) => [`${g.name} options`, g.values.join(" / ")]),
      ["Best for", deal.tag.toLowerCase()],
    ],
    "Warranty & condition": [["Warranty", "6 months"], ["Replacement", "15 days"], ["Condition", "Superb"], ["Quality check", "40 points"]],
  };
  type Tab = keyof typeof tabs;
  const [tab, setTab] = useState<Tab>("Specifications");
  const icons = { Specifications: Cpu, "Warranty & condition": HardDrive };

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-border sm:p-8">
      <h2 className="text-xl font-extrabold text-navy">Technical specification</h2>
      <div role="tablist" className="mt-5 grid grid-cols-2 border-b border-border">
        {(Object.keys(tabs) as Tab[]).map((t) => {
          const Icon = icons[t];
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative flex items-center justify-center gap-2 pb-3 text-sm font-bold transition ${tab === t ? "text-ember" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="size-4" /> {t}
              {tab === t && <motion.span layoutId="spec-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-ember" />}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.dl key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 grid gap-x-8 sm:grid-cols-2">
          {tabs[tab].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-border/70 py-3 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-semibold capitalize">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </AnimatePresence>
    </section>
  );
}

function QcReport() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-border sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-navy">Quality check results</h2>
          <p className="text-sm text-muted-foreground">Your unit&apos;s own report is shared on enquiry</p>
        </div>
        {SAMPLE}
      </div>
      <ul className="mt-5 space-y-2">
        {QC.map((g, i) => (
          <li key={g.title} className="overflow-hidden rounded-xl bg-cream/60 ring-1 ring-peach">
            <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold">
              <g.icon className="size-4 text-navy" /> {g.title}
              <span className="ml-auto text-xs font-semibold text-emerald-700">{g.items.length}/{g.items.length} passed</span>
              <ChevronDown className={`size-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden px-4">
                  {g.items.map((it) => (
                    <li key={it} className="flex items-center gap-2 border-t border-peach py-2.5 text-sm">
                      <Check className="size-4 text-emerald-600" /> {it}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductDetails({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6">
      <TestedFor deal={deal} />
      <Specs deal={deal} />
      <QcReport />
    </div>
  );
}
