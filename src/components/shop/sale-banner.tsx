"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, FileText, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { DealCard } from "@/components/shop/deals";
import { DEALS } from "@/lib/shop-data";

const CODE = "ALPHA500";
const pad = (n: number) => String(n).padStart(2, "0");

const PERKS = [
  { icon: ShieldCheck, title: "6 Month Warranty", sub: "On every device" },
  { icon: BadgeCheck, title: "40-Point Check", sub: "Tested before listing" },
  { icon: RotateCcw, title: "15 Days Replacement", sub: "Hassle-free" },
  { icon: Truck, title: "Fast & Safe Delivery", sub: "Pan-India, 1–3 days" },
  { icon: FileText, title: "GST Invoice", sub: "For every order" },
];

function useCountdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const s = left === null ? null : Math.floor(left / 1000);
  return [
    { label: "Days", value: s === null ? null : Math.floor(s / 86400) },
    { label: "Hrs", value: s === null ? null : Math.floor((s % 86400) / 3600) },
    { label: "Mins", value: s === null ? null : Math.floor((s % 3600) / 60) },
    { label: "Secs", value: s === null ? null : s % 60 },
  ];
}

export function SaleBanner() {
  const parts = useCountdown();
  const copy = () => {
    navigator.clipboard?.writeText(CODE).catch(() => undefined);
    toast.success(`Code ${CODE} copied`, { description: "Mention it when you enquire on WhatsApp." });
  };

  return (
    <section className="container-x py-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-peach bg-gradient-to-br from-peach via-cream to-white px-6 pt-8 pb-14 shadow-sm sm:px-10">
        <div className="absolute -top-20 -left-16 -z-10 size-72 rounded-full bg-amber-300/40 blur-3xl" aria-hidden />
        <div className="absolute -right-16 -bottom-24 -z-10 size-72 rounded-full bg-orange-300/30 blur-3xl" aria-hidden />

        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold tracking-wider text-white">
              <span className="size-1.5 animate-ping rounded-full bg-white" /> SALE LIVE NOW
            </span>
            <p className="mt-4 text-xs font-bold tracking-[0.25em] text-ember">✦ REFURB FEST ✦</p>
            <div className="flex items-start gap-3">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-black tracking-tight text-navy uppercase sm:text-5xl 2xl:text-6xl"
              >
                Mega Refurb Sale
              </motion.h2>
              <motion.span
                initial={{ rotate: -30, scale: 0 }}
                whileInView={{ rotate: -12, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mt-1 hidden size-16 shrink-0 place-items-center rounded-full bg-rose-600 text-xs font-black text-white shadow-lg ring-4 ring-rose-200 sm:grid"
              >
                SALE
              </motion.span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-lg font-bold text-navy/80">UP TO</span>
              <span className="rounded-xl bg-gradient-to-r from-ember to-rose-500 px-4 py-1 text-3xl font-black text-white shadow-md">70% OFF</span>
              <a href="#deals" className="group ml-1 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-navy-deep">
                Shop Now <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-navy/70">SALE ENDS IN</p>
            <div className="mt-3 flex justify-center gap-2.5">
              {parts.map((p) => (
                <div key={p.label} className="w-16 rounded-xl bg-white py-2 shadow-md ring-1 ring-peach">
                  <p className="text-2xl font-black text-navy tabular-nums">{p.value === null ? "--" : pad(p.value)}</p>
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={copy}
            className="group mx-auto flex flex-col items-center rounded-2xl border-2 border-dashed border-amber-500 bg-gradient-to-b from-amber-100 to-amber-50 px-6 py-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-[11px] font-bold tracking-widest text-amber-700">USE CODE</span>
            <span className="text-2xl font-black tracking-widest text-navy">{CODE}</span>
            <span className="text-[10px] font-semibold tracking-wider text-amber-700 group-hover:text-ember">TAP TO COPY</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 -mt-5 flex justify-center">
        <span className="rounded-full bg-navy px-5 py-2 text-xs font-bold tracking-wider text-white shadow-lg ring-4 ring-cream">
          UPGRADE SMART, SPEND LESS
        </span>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-sm ring-1 ring-border sm:grid-cols-3 lg:grid-cols-5">
        {PERKS.map((p) => (
          <li key={p.title} className="flex items-center gap-3 bg-white px-4 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-navy ring-1 ring-peach">
              <p.icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-navy">{p.title}</span>
              <span className="block text-xs text-muted-foreground">{p.sub}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {DEALS.slice(0, 5).map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </section>
  );
}
