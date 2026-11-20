"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Plus } from "lucide-react";
import { useStoreEnabled } from "@/components/store/store-flag";

const FAQS = [
  { q: "Why choose a refurbished laptop?", a: "You get business-grade hardware at a fraction of the new price, and every purchase keeps a working device out of landfill." },
  { q: "What warranty and support do I get?", a: "Every device carries a 6 month warranty. Reach us on WhatsApp or the enquiry form and we respond the same day." },
  { q: "Can I return or replace a device?", a: "Yes. Within 15 days, tell us what is wrong and we will arrange a replacement." },
];

const BUY_OFFLINE = { q: "How do I buy, if there is no cart?", a: "Tap Get best price or WhatsApp on any device. We confirm availability, share a final quote and arrange payment and delivery with you directly." };
const BUY_ONLINE = { q: "How do I buy?", a: "Add a device to your cart, check out and pay with PhonePe (UPI, cards or netbanking). For a custom quote, enquire on WhatsApp." };

export function Faq() {
  const store = useStoreEnabled();
  const faqs = [FAQS[0], FAQS[1], store ? BUY_ONLINE : BUY_OFFLINE, FAQS[2]];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container-x grid gap-10 py-16 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="self-start lg:sticky lg:top-32">
        <p className="text-xs font-bold tracking-widest text-ember">FAQ</p>
        <h2 className="mt-2 text-4xl leading-tight font-extrabold tracking-tight text-navy sm:text-5xl">Questions, answered.</h2>
        <p className="mt-4 max-w-sm text-muted-foreground">Still unsure about something? Ask us directly. We usually reply within minutes.</p>
        <a
          href="https://wa.me/?text=Hi%20Alpha%20Mart%2C%20I%20have%20a%20question."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-95"
        >
          <MessageCircle className="size-4" /> Ask on WhatsApp
        </a>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <li key={f.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-start gap-5 py-6 text-left"
              >
                <span className="pt-1 font-mono text-sm text-ember">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-xl font-semibold text-navy transition group-hover:text-ember sm:text-2xl">{f.q}</span>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ring-1 transition duration-300 ${isOpen ? "rotate-45 bg-navy text-white ring-navy" : "ring-border group-hover:ring-ember"}`}>
                  <Plus className="size-4" />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-xl pr-14 pb-6 pl-11 text-muted-foreground">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
