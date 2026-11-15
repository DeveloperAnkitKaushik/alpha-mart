"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  error: "bg-rose-50 text-rose-600 ring-rose-200",
  empty: "bg-cream text-navy ring-peach",
  info: "bg-sky-50 text-skyblue ring-sky-200",
};

// One consistent look for empty, error and info states across the site.
export function StateCard({
  icon: Icon,
  tone = "empty",
  title,
  body,
  children,
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-border", className)}
    >
      <motion.span
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
        className={cn("grid size-16 place-items-center rounded-2xl ring-1", TONES[tone])}
      >
        <Icon className="size-7" aria-hidden />
      </motion.span>
      <h2 className="mt-4 text-xl font-extrabold text-navy-deep">{title}</h2>
      {body && <div className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{body}</div>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </motion.div>
  );
}
