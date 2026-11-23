"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { BellRing, CheckCircle2, ClipboardList, Clock, MessageCircle } from "lucide-react";
import { AuthForm } from "@/components/site/auth-form";
import { Wordmark } from "@/components/site/wordmark";
import { signOutUser, useAuth } from "@/lib/auth-store";

const BENEFITS = [
  { icon: ClipboardList, title: "Every enquiry in one place", body: "See the laptops you asked about and their status." },
  { icon: BellRing, title: "Faster replies", body: "We already have your details, so quotes come quicker." },
  { icon: MessageCircle, title: "One tap to WhatsApp", body: "Continue any conversation with our team instantly." },
];

const DOTS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

function PreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 80, damping: 14 }}
      className="mt-10 max-w-sm rounded-2xl bg-white p-4 text-foreground shadow-2xl"
    >
      <p className="text-xs font-bold tracking-wider text-muted-foreground">YOUR ENQUIRY</p>
      <p className="mt-1 font-bold text-navy">Dell Latitude 7410 · 16 GB · 512 GB</p>
      <div className="mt-3 flex items-center gap-2">
        {["Sent", "Contacted", "Quoted"].map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 + i * 0.4 }}
            className="flex items-center gap-1 rounded-full bg-[#34A853]/10 px-2.5 py-1 text-[11px] font-bold text-[#137333]"
          >
            <CheckCircle2 className="size-3.5" /> {s}
          </motion.span>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> Quote shared on WhatsApp
      </p>
    </motion.div>
  );
}

export function SignInView({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const next = useSearchParams().get("next");
  // Same-site paths only: rejects "//host", "/\\host" and control chars that browsers normalise into "//host".
  const target = next && /^\/(?![/\\])[^\t\r\n]*$/.test(next) ? next : "/dashboard";
  const email = useAuth((s) => s.user?.email ?? null);
  const ready = useAuth((s) => s.ready);

  return (
    <div className={embedded ? "" : "container-x py-10"}>
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-border lg:grid-cols-2">
        <aside className="relative isolate hidden overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-skyblue p-12 text-white lg:block">
          {DOTS.map((c, i) => (
            <motion.span
              key={c}
              aria-hidden
              animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
              className="absolute -z-10 size-40 rounded-full opacity-30 blur-3xl"
              style={{ background: c, top: `${10 + i * 22}%`, left: `${(i % 2) * 55 + 10}%` }}
            />
          ))}
          <Link href="/" aria-label="Alpha Mart home" className="inline-block">
            <Wordmark tone="light" className="text-3xl" />
          </Link>
          <h2 className="mt-10 text-4xl leading-tight font-extrabold">
            Your refurbished tech,
            <br />
            <span className="text-amber-300">tracked in one place.</span>
          </h2>
          <ul className="mt-8 space-y-5">
            {BENEFITS.map((b, i) => (
              <motion.li key={b.title} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <b.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{b.title}</span>
                  <span className="block text-sm text-white/75">{b.body}</span>
                </span>
              </motion.li>
            ))}
          </ul>
          <PreviewCard />
        </aside>

        <section className="relative flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#4285F4_0_25%,#EA4335_25%_50%,#FBBC05_50%_75%,#34A853_75%)]" aria-hidden />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            {ready && email ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-12 text-[#34A853]" />
                <h1 className="mt-3 text-2xl font-extrabold text-navy">You&apos;re signed in</h1>
                <p className="mt-1 text-sm text-muted-foreground">{email}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link href={target} className="rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-deep">Go to my enquiries</Link>
                  <button type="button" onClick={() => void signOutUser()} className="rounded-xl px-6 py-3 text-sm font-bold text-navy ring-1 ring-border transition hover:bg-cream">
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight text-navy">Welcome to Alpha Mart</h1>
                <p className="mt-1 mb-7 text-sm text-muted-foreground">Sign in or create a free account to track your enquiries.</p>
                <AuthForm onSuccess={() => router.push(target)} />
              </>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
}
