"use client";

import { motion } from "motion/react";
import { Check, MessageCircle, Mic, PhoneOff, Video } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { Reveal } from "@/components/site/reveal";

const WA = "https://wa.me/?text=Hi%20Alpha%20Mart%2C%20can%20I%20see%20a%20laptop%20on%20a%20video%20call%3F";
const POINTS = ["See the exact unit, not a stock photo", "Check every port, key and scratch", "Ask anything before you decide"];

function Chip({ className, delay, children }: { className: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.span
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.5, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute z-20 hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-xl sm:flex ${className}`}
    >
      {children}
    </motion.span>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-48 sm:w-52">
      <motion.div
        initial={{ rotate: -8, y: 20, opacity: 0 }}
        whileInView={{ rotate: -4, y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 70, damping: 14 }}
        className="relative rounded-[2.2rem] bg-zinc-900 p-2 shadow-2xl ring-1 ring-white/20"
      >
        <div className="relative aspect-[9/17] overflow-hidden rounded-[1.7rem] bg-zinc-800">
          <ShopImage name="laptop" fit="cover" className="absolute inset-0 size-full" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-3 pt-3 pb-6 text-[10px] font-semibold text-white">
            <span className="flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5">
              <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
            <span>02:14</span>
          </div>
          <div className="absolute right-2.5 bottom-16 size-14 overflow-hidden rounded-xl bg-gradient-to-br from-sky-300 to-navy ring-2 ring-white/70" aria-hidden>
            <span className="grid size-full place-items-center text-lg font-black text-white">You</span>
          </div>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-white/25 text-white backdrop-blur"><Mic className="size-4" /></span>
            <span className="grid size-9 place-items-center rounded-full bg-rose-600 text-white"><PhoneOff className="size-4" /></span>
            <span className="grid size-9 place-items-center rounded-full bg-white/25 text-white backdrop-blur"><Video className="size-4" /></span>
          </div>
        </div>
        <span className="absolute top-3.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-full bg-zinc-900" aria-hidden />
      </motion.div>
      <Chip className="top-10 -left-24" delay={0}>
        <Check className="size-3.5 text-emerald-600" /> Battery 92% health
      </Chip>
      <Chip className="-right-24 bottom-24" delay={1.2}>
        <Check className="size-3.5 text-emerald-600" /> No scratches on lid
      </Chip>
    </div>
  );
}

export function LiveBanner() {
  return (
    <section className="container-x py-10">
      <Reveal>
        <div className="relative isolate grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep via-navy to-sky-500 px-6 py-10 text-white shadow-xl sm:px-12 lg:grid-cols-[1.1fr_auto_1fr] lg:py-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(oklch(1_0_0/0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_right,black,transparent_80%)]" aria-hidden />
          <div className="absolute top-1/2 left-1/2 -z-10 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/30 blur-3xl" aria-hidden />

          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-widest ring-1 ring-white/20">
              <Video className="size-3.5" /> LIVE VIDEO SHOPPING
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              Not sure which laptop?
              <br />
              <span className="text-amber-300">See it live before you buy.</span>
            </h2>
            <ul className="mt-5 space-y-2 text-sm text-white/85">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-400/20 text-emerald-300"><Check className="size-3" /></span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <PhoneMock />

          <div className="text-center lg:text-right">
            <p className="text-sm font-semibold tracking-widest text-white/60">FREE · NO OBLIGATION</p>
            <p className="mt-1 text-2xl font-extrabold">Book a 10-minute video call</p>
            <p className="mt-1 text-sm text-white/75">We pick up within minutes, 10 am to 8 pm.</p>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:brightness-95"
            >
              <MessageCircle className="size-5" /> Book on WhatsApp
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black tracking-wider">LIVE</span>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
