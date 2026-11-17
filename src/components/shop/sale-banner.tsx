"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, FileText, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { DealCard, DealRail } from "@/components/shop/deals";
import { useSiteContent } from "@/components/site/site-content";
import type { Sale } from "@/lib/site-content";

const pad = (n: number) => String(n).padStart(2, "0");

const PERKS = [
  { icon: ShieldCheck, title: "6 Month Warranty", sub: "On every device" },
  { icon: BadgeCheck, title: "40-Point Check", sub: "Tested before listing" },
  { icon: RotateCcw, title: "15 Days Replacement", sub: "Hassle-free" },
  { icon: Truck, title: "Fast & Safe Delivery", sub: "Pan-India, 1–3 days" },
  { icon: FileText, title: "GST Invoice", sub: "For every order" },
];

// An empty end date means the sale rolls over at the end of every month.
export function saleEnd(endsAt: string, now: Date) {
  return endsAt ? new Date(`${endsAt}T00:00:00`).getTime() : new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

function useCountdown(endsAt: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = saleEnd(endsAt, new Date());
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const s = left === null ? null : Math.floor(left / 1000);
  return {
    ended: left === 0,
    parts: [
      { label: "Days", value: s === null ? null : Math.floor(s / 86400) },
      { label: "Hrs", value: s === null ? null : Math.floor((s % 86400) / 3600) },
      { label: "Mins", value: s === null ? null : Math.floor((s % 3600) / 60) },
      { label: "Secs", value: s === null ? null : s % 60 },
    ],
  };
}

type Parts = ReturnType<typeof useCountdown>["parts"];

function copyCode(code: string) {
  navigator.clipboard?.writeText(code).catch(() => undefined);
  toast.success(`Code ${code} copied`, { description: "Mention it when you enquire on WhatsApp." });
}

function Countdown({ parts, small }: { parts: Parts; small?: boolean }) {
  return (
    <div className="flex justify-center gap-2.5">
      {parts.map((p) => (
        <div key={p.label} className={`rounded-xl bg-white shadow-md ring-1 ring-peach ${small ? "w-12 py-1" : "w-16 py-2"}`}>
          <p className={`font-black text-navy tabular-nums ${small ? "text-lg" : "text-2xl"}`}>{p.value === null ? "--" : pad(p.value)}</p>
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{p.label}</p>
        </div>
      ))}
    </div>
  );
}

export function SaleBanner() {
  const { sale, products } = useSiteContent();
  const { ended, parts } = useCountdown(sale.endsAt);
  if (!sale.enabled || ended) return null;
  const onSale = products.filter((p) => p.onSale);

  if (sale.layout === "products") {
    if (!onSale.length) return null;
    return (
      <section className="container-x py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {sale.eyebrow && <p className="text-xs font-bold tracking-[0.25em] text-ember">{sale.eyebrow}</p>}
            <h2 className="text-3xl font-black tracking-tight text-navy uppercase sm:text-4xl">
              {sale.title} {sale.discount && <span className="text-ember">· {sale.discount}</span>}
            </h2>
          </div>
          <div className="text-center">
            <p className="mb-2 text-xs font-bold tracking-widest text-navy/70">ENDS IN</p>
            <Countdown parts={parts} small />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {onSale.slice(0, 8).map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      </section>
    );
  }

  if (sale.layout === "compact") {
    return (
      <section className="container-x py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-navy-deep via-navy to-ember px-6 py-4 text-white shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold tracking-wider">
              <span className="size-1.5 animate-ping rounded-full bg-white" /> LIVE
            </span>
            <p className="text-xl font-black tracking-tight uppercase sm:text-2xl">{sale.title}</p>
            {sale.discount && <span className="rounded-lg bg-white px-3 py-0.5 text-lg font-black text-ember">{sale.discount}</span>}
          </div>
          <Countdown parts={parts} small />
          {sale.code && (
            <button type="button" onClick={() => copyCode(sale.code)} className="rounded-xl border-2 border-dashed border-amber-300 px-4 py-2 text-sm font-black tracking-widest transition hover:bg-white/10">
              {sale.code} <span className="ml-1 text-[10px] font-semibold text-amber-200">COPY</span>
            </button>
          )}
        </div>
        {onSale.length > 0 && (
          <div className="mt-4">
            <DealRail deals={onSale} />
          </div>
        )}
      </section>
    );
  }

  return <Spotlight sale={sale} parts={parts} onSale={onSale} />;
}

function Spotlight({ sale, parts, onSale }: { sale: Sale; parts: Parts; onSale: ReturnType<typeof useSiteContent>["products"] }) {
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
            {sale.eyebrow && <p className="mt-4 text-xs font-bold tracking-[0.25em] text-ember">{sale.eyebrow}</p>}
            <div className="flex items-start gap-3">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-black tracking-tight text-navy uppercase sm:text-5xl 2xl:text-6xl"
              >
                {sale.title}
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
              {sale.discount && (
                <>
                  <span className="text-lg font-bold text-navy/80">UP TO</span>
                  <span className="rounded-xl bg-gradient-to-r from-ember to-rose-500 px-4 py-1 text-3xl font-black text-white shadow-md">{sale.discount}</span>
                </>
              )}
              <a href="#deals" className="group ml-1 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-navy-deep">
                Shop Now <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-navy/70">SALE ENDS IN</p>
            <div className="mt-3">
              <Countdown parts={parts} />
            </div>
          </div>

          {sale.code && (
            <button
              type="button"
              onClick={() => copyCode(sale.code)}
              className="group mx-auto flex flex-col items-center rounded-2xl border-2 border-dashed border-amber-500 bg-gradient-to-b from-amber-100 to-amber-50 px-6 py-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-[11px] font-bold tracking-widest text-amber-700">USE CODE</span>
              <span className="text-2xl font-black tracking-widest text-navy">{sale.code}</span>
              <span className="text-[10px] font-semibold tracking-wider text-amber-700 group-hover:text-ember">TAP TO COPY</span>
            </button>
          )}
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

      {onSale.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {onSale.slice(0, 5).map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </section>
  );
}
