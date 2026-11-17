"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteContent } from "@/components/site/site-content";

const INTERVAL_MS = 5500;

export function HeroCarousel() {
  const all = useSiteContent().banners;
  const posters = useMemo(() => all.filter((b) => b.enabled), [all]);
  const count = posters.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => setI((n + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, i, count]);

  if (!count) return null;
  // The banner list can shrink while the carousel is showing (admin preview).
  const at = i % count;
  const p = posters[at];
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
            <Image src={p.mobile || p.desktop} alt={p.alt} fill priority unoptimized sizes="100vw" className="object-cover md:hidden" />
            <Image src={p.desktop} alt="" aria-hidden fill priority unoptimized sizes="100vw" className="hidden object-cover md:block" />
          </Link>
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        [
          { n: -1, Icon: ChevronLeft, label: "Previous poster", pos: "right-16" },
          { n: 1, Icon: ChevronRight, label: "Next poster", pos: "right-5" },
        ] as const
      ).map(({ n, Icon, label, pos }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={() => go(at + n)}
          className={`absolute bottom-14 hidden size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 md:grid ${pos}`}
        >
          <Icon className="size-5" />
        </button>
      ))}
      {count > 1 && <div className="absolute inset-x-0 bottom-14 flex justify-center gap-2">
        {posters.map((d, n) => (
          <button
            key={d.id}
            type="button"
            aria-label={`Go to poster ${n + 1}`}
            aria-current={n === at}
            onClick={() => go(n)}
            className={`h-2 rounded-full transition-all ${n === at ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>}
    </section>
  );
}
