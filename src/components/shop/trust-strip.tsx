"use client";

import { motion } from "motion/react";
import { Leaf, MapPinned, Smile, Star } from "lucide-react";
import CountUp from "@/components/CountUp";

const STATS = [
  { icon: Smile, to: 12500, suffix: "+", label: "Devices supplied", tone: "from-orange-400 to-amber-300" },
  { icon: MapPinned, to: 800, suffix: "+", label: "Pincodes served", tone: "from-sky-500 to-cyan-300" },
  { icon: Leaf, to: 140, suffix: " t", label: "CO₂ saved", tone: "from-emerald-500 to-lime-300" },
  { icon: Star, to: 4.7, suffix: " / 5", label: "Customer rating", decimals: 1, tone: "from-violet-500 to-fuchsia-300" },
];

export function TrustStrip() {
  return (
    <div className="container-x relative z-10 -mt-10">
      <motion.dl
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-xl ring-1 ring-black/5 lg:grid-cols-4"
      >
        {STATS.map((s) => (
          <div key={s.label} className="group flex items-center gap-4 bg-white px-5 py-5 transition duration-300 hover:bg-cream sm:px-7">
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition duration-300 group-hover:scale-110 group-hover:-rotate-6 ${s.tone}`}
            >
              <s.icon className="size-6" />
            </span>
            <div>
              <dd className="text-2xl leading-none font-extrabold tracking-tight text-navy tabular-nums sm:text-3xl">
                <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} separator="," duration={1.6} />
              </dd>
              <dt className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</dt>
            </div>
          </div>
        ))}
      </motion.dl>
    </div>
  );
}
