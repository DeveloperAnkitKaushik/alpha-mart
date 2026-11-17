"use client";

import { motion } from "motion/react";
import { Leaf, MapPinned, Smile, Star, Truck, Users, type LucideIcon } from "lucide-react";
import CountUp from "@/components/CountUp";
import { useSiteContent } from "@/components/site/site-content";
import { cn } from "@/lib/utils";
import type { Stat } from "@/lib/site-content";

export const STAT_ICON: Record<Stat["icon"], LucideIcon> = { smile: Smile, map: MapPinned, leaf: Leaf, star: Star, users: Users, truck: Truck };
const TONES = ["from-orange-400 to-amber-300", "from-sky-500 to-cyan-300", "from-emerald-500 to-lime-300", "from-violet-500 to-fuchsia-300"];
const COLS = ["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4"];

export function TrustStrip() {
  const { stats, banners } = useSiteContent();
  if (!stats.length) return null;
  // The strip overlaps the hero; with no banner showing it sits in normal flow.
  const overlapHero = banners.some((b) => b.enabled);
  return (
    <div className={cn("container-x relative z-10", overlapHero ? "-mt-10" : "mt-6")}>
      <motion.dl
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-xl ring-1 ring-black/5", COLS[stats.length])}
      >
        {stats.map((s, i) => {
          const Icon = STAT_ICON[s.icon];
          return (
            <div key={i} className="group flex items-center gap-4 bg-white px-5 py-5 transition duration-300 hover:bg-cream sm:px-7">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition duration-300 group-hover:scale-110 group-hover:-rotate-6 ${TONES[i % TONES.length]}`}
              >
                <Icon className="size-6" />
              </span>
              <div>
                <dd className="text-2xl leading-none font-extrabold tracking-tight text-navy tabular-nums sm:text-3xl">
                  <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals} separator="," duration={1.6} />
                </dd>
                <dt className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</dt>
              </div>
            </div>
          );
        })}
      </motion.dl>
    </div>
  );
}
