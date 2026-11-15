"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, FileText, RotateCcw, ShieldCheck, Video } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { SHOP_IMAGES } from "@/lib/shop-images";
import type { Deal } from "@/lib/shop-data";

const STRIP = [
  { icon: BadgeCheck, label: "40-Point Tested" },
  { icon: ShieldCheck, label: "6M Warranty" },
  { icon: RotateCcw, label: "15 Day Replace" },
];

const INFO = [
  { icon: Video, title: "See it on a video call", sub: "We show you this exact unit before you decide" },
  { icon: FileText, title: "GST invoice included", sub: "Proper billing for business purchases" },
];

export function ProductGallery({ deal }: { deal: Deal }) {
  const photos = SHOP_IMAGES[deal.image] ?? [];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[4.5rem_1fr]">
        {photos.length > 1 && (
          <ul className="order-2 flex gap-2 sm:order-1 sm:flex-col">
            {photos.map((src, i) => (
              <li key={src}>
                <button
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={active === i}
                  onClick={() => setActive(i)}
                  className={`relative block size-16 overflow-hidden rounded-xl bg-white ring-2 transition ${active === i ? "ring-navy" : "ring-border hover:ring-navy/40"}`}
                >
                  <Image src={src} alt="" fill unoptimized sizes="64px" className="object-contain p-1" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={`relative order-1 rounded-3xl border-2 border-amber-300/70 bg-white p-4 shadow-sm sm:order-2 ${photos.length > 1 ? "" : "sm:col-span-2"}`}>
          <span className="absolute top-4 left-4 z-10 rounded-md bg-navy px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">{deal.tag}</span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Hi Alpha Mart, can I see the ${deal.name} on a video call?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-600 shadow ring-1 ring-rose-200 transition hover:bg-rose-50"
          >
            <span className="size-1.5 animate-ping rounded-full bg-rose-500" /> <Video className="size-3.5" /> Live view
          </a>
          <div className="relative aspect-[4/3]">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                {photos[active] ? (
                  <Image src={photos[active]} alt={deal.name} fill priority unoptimized sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain" />
                ) : (
                  <ShopImage name={deal.image} className="size-full" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <ul className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl bg-navy text-white">
            {STRIP.map((s) => (
              <li key={s.label} className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold">
                <s.icon className="size-4 shrink-0 text-amber-300" /> {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {INFO.map((c) => (
          <div key={c.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-border">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-ember ring-1 ring-peach">
              <c.icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-navy">{c.title}</span>
              <span className="block text-xs text-muted-foreground">{c.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
