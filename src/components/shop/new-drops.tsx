"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DealRail } from "@/components/shop/deals";
import { useSiteContent } from "@/components/site/site-content";

const TABS = ["Best Sellers", "New Arrivals"] as const;
type Tab = (typeof TABS)[number];

export function NewDrops() {
  const [tab, setTab] = useState<Tab>("Best Sellers");
  const products = useSiteContent().products;
  // Newest products are added at the end of the list.
  const shown = useMemo(
    () => (tab === "Best Sellers" ? [...products].sort((a, b) => b.reviews - a.reviews) : [...products].reverse()),
    [products, tab],
  );
  if (!products.length) return null;

  return (
    <section className="container-x py-10">
      <div className="grid gap-8 overflow-hidden rounded-3xl bg-[oklch(0.17_0.01_260)] p-6 sm:p-10 lg:grid-cols-[16rem_1fr] lg:items-center">
        <div>
          <h2 className="text-3xl leading-tight font-extrabold text-white">New Drops, Don&apos;t Miss Them!</h2>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">Grab Yours Now!</p>
          <ul role="tablist" className="mt-8 space-y-3">
            {TABS.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-3 text-base font-semibold transition ${tab === t ? "text-white" : "text-white/50 hover:text-white/80"}`}
                >
                  <span className={`size-2.5 rounded-full transition ${tab === t ? "bg-white ring-4 ring-white/20" : "bg-white/30"}`} />
                  <span className={tab === t ? "underline underline-offset-8" : ""}>{t}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="min-w-0">
            <DealRail deals={shown} dark />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
