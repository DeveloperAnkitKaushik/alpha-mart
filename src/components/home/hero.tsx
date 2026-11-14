"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BarChart3, FileText, User } from "lucide-react";
import CountUp from "@/components/CountUp";
import { AuthDialog } from "@/components/site/auth-dialog";
import { useAuth } from "@/lib/auth-store";
import { isFirebaseConfigured } from "@/lib/firebase";

const STATS = [
  { to: 21, suffix: "Cr+", label: "Buyers" },
  { to: 84, suffix: "L+", label: "Sellers" },
  { to: 12, suffix: "Cr+", label: "Products & services" },
  { to: 5, suffix: " Years", label: "Empowering businesses" },
];

const RINGS = ["size-[26rem]", "size-[40rem]", "size-[56rem]", "size-[74rem]"];

const pill =
  "group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold whitespace-nowrap shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl";

function SignInPill() {
  const isSignedIn = useAuth((s) => s.user !== null);
  if (!isFirebaseConfigured || isSignedIn) return null;
  return (
    <AuthDialog
      label=""
      trigger={
        <button type="button" className={`${pill} text-amber-600`}>
          <User className="size-4" /> Sign In
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </button>
      }
    />
  );
}

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden>
        {RINGS.map((size) => (
          <span
            key={size}
            className={`absolute top-1/2 left-1/2 ${size} -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]`}
          />
        ))}
        <div className="absolute -top-32 left-1/4 size-[26rem] animate-float rounded-full bg-brand-violet/35 blur-[110px]" />
        <div className="absolute top-1/3 -right-20 size-[22rem] animate-float rounded-full bg-brand/25 blur-[110px] [animation-delay:-2s]" />
      </div>

      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-light tracking-tight text-white/90 sm:text-4xl"
        >
          India&apos;s Largest Online <strong className="font-bold text-white">B2B Marketplace</strong>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <p className="text-base text-white/85">
            Connecting <strong className="text-white">21 Cr+ Buyers</strong> with Trusted Sellers
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/requirement" className={`${pill} text-hero-from`}>
              <FileText className="size-4" /> Post Requirement
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <Link href="/dashboard" className={`${pill} text-brand`}>
              <BarChart3 className="size-4" /> Start Selling
              <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </Link>
            <SignInPill />
          </div>
        </motion.div>
      </div>

      <dl className="mx-auto mt-4 grid max-w-[90rem] grid-cols-2 gap-x-6 gap-y-4 border-t border-white/15 px-4 py-5 text-white sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2 sm:justify-center">
            <dd className="text-xl font-bold whitespace-nowrap tabular-nums sm:text-2xl">
              <CountUp to={s.to} suffix={s.suffix} duration={1.6} />
            </dd>
            <dt className="text-[10px] tracking-wider text-white/70 uppercase sm:text-xs">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
