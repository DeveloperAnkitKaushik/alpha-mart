"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SHOP_CATEGORIES } from "@/lib/shop-data";

const EXTRA_LINKS = [
  { href: "/requirement", label: "Send a requirement" },
  { href: "/dashboard", label: "My enquiries" },
  { href: "/credits", label: "Photo credits" },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50"
          />
          <motion.nav
            key="panel"
            aria-label="Main menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white p-5 text-foreground shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold tracking-wide text-muted-foreground">SHOP</p>
              <button type="button" aria-label="Close menu" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
            <ul className="space-y-1">
              {SHOP_CATEGORIES.map((c) => (
                <li key={c.label}>
                  <Link href={`/collections/${c.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2.5 font-medium text-navy transition hover:bg-cream">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <hr className="my-4 border-border" />
            <ul className="space-y-1 text-sm">
              {EXTRA_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className="block rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-cream hover:text-navy">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
