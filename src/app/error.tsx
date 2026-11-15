"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Home, MessageCircle, RotateCw, Wrench } from "lucide-react";
import { stateBtn } from "@/components/site/state-styles";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <div className="bg-cream">
      <div className="container-x flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
        <motion.span
          initial={{ rotate: -30, scale: 0.6, opacity: 0 }}
          animate={{ rotate: [0, -12, 12, 0], scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="grid size-20 place-items-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-200"
        >
          <Wrench className="size-9" aria-hidden />
        </motion.span>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-navy-deep sm:text-4xl">Something went wrong on our side</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            The page hit a snag while loading. Try again, and if it keeps happening, message us on WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={retry} className={stateBtn.primary}>
              <RotateCw className="size-4" /> Try again
            </button>
            <Link href="/" className={stateBtn.ghost}>
              <Home className="size-4" /> Go home
            </Link>
            <a href="https://wa.me/?text=Hi%20Alpha%20Mart%2C%20a%20page%20on%20your%20site%20is%20not%20working." target="_blank" rel="noopener noreferrer" className={stateBtn.ghost}>
              <MessageCircle className="size-4 text-[#25D366]" /> Tell us
            </a>
          </div>
          {digest && <p className="mt-6 font-mono text-xs text-muted-foreground">Reference: {digest}</p>}
        </motion.div>
      </div>
    </div>
  );
}
