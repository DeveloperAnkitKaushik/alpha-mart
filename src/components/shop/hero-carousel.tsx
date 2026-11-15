"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// shortcut: demo banners supplied by the owner (not ours to publish), replace with Alpha Mart artwork before going live.
const POSTERS = [1, 2, 3].map((n) => ({ id: `banner-${n}`, href: "#deals", alt: `Sale banner ${n}` }));

const INTERVAL_MS = 5500;

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => setI((n + POSTERS.length) % POSTERS.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % POSTERS.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, i]);

  const p = POSTERS[i];
  const external = p.href.startsWith("http");

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative aspect-[768/1365] overflow-hidden bg-cream md:aspect-[1440/503]"
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={p.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Link href={p.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="relative block size-full">
            <Image src={`/posters/${p.id}-mobile.jpg`} alt={p.alt} fill priority unoptimized sizes="100vw" className="object-cover md:hidden" />
            <Image src={`/posters/${p.id}-desktop.jpg`} alt="" aria-hidden fill priority unoptimized sizes="100vw" className="hidden object-cover md:block" />
          </Link>
        </motion.div>
      </AnimatePresence>

      {(
        [
          { n: -1, Icon: ChevronLeft, label: "Previous poster", pos: "right-16" },
          { n: 1, Icon: ChevronRight, label: "Next poster", pos: "right-5" },
        ] as const
      ).map(({ n, Icon, label, pos }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={() => go(i + n)}
          className={`absolute bottom-14 hidden size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 md:grid ${pos}`}
        >
          <Icon className="size-5" />
        </button>
      ))}
      <div className="absolute inset-x-0 bottom-14 flex justify-center gap-2">
        {POSTERS.map((d, n) => (
          <button
            key={d.id}
            type="button"
            aria-label={`Go to poster ${n + 1}`}
            aria-current={n === i}
            onClick={() => go(n)}
            className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}
