"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, MapPin, X } from "lucide-react";
import { SectionHeading } from "@/components/shop/decor";
import { Reveal } from "@/components/site/reveal";

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore"];

type Cell = boolean | string;
const ROWS: { label: string; us: Cell; oem: Cell; local: Cell }[] = [
  { label: "Price", us: "Up to 70% less", oem: "Full price", local: "Varies" },
  { label: "Warranty", us: "6 months", oem: "1 year", local: "None to 1 month" },
  { label: "Quality check", us: "40 points", oem: true, local: false },
  { label: "Doorstep delivery", us: true, oem: true, local: false },
  { label: "GST invoice", us: true, oem: true, local: "Sometimes" },
];

function CellView({ v, strong }: { v: Cell; strong?: boolean }) {
  if (v === true) return <Check className={`mx-auto size-5 ${strong ? "text-emerald-600" : "text-emerald-500"}`} aria-label="Yes" />;
  if (v === false) return <X className="mx-auto size-5 text-rose-500" aria-label="No" />;
  return <span className={strong ? "font-bold text-navy" : "text-muted-foreground"}>{v}</span>;
}

export function ServiceCoverage() {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pin = String(new FormData(e.currentTarget).get("pin") ?? "").trim();
    setResult(
      /^[1-9]\d{5}$/.test(pin)
        ? { ok: true, text: `Good news! We deliver to ${pin} in 1–3 days.` }
        : { ok: false, text: "Enter a valid 6-digit PIN code." },
    );
  };

  return (
    <section className="container-x py-12">
      <SectionHeading title="Service Coverage Across" accent="India" sub="Delivery and support wherever you are" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border sm:p-8">
          <label htmlFor="pin" className="text-sm font-semibold text-navy">
            Enter your PIN code to check delivery
          </label>
          <form onSubmit={onSubmit} noValidate className="mt-3 flex gap-2">
            <input
              id="pin"
              name="pin"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN code, e.g. 110001"
              className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-cream/50 px-4 text-sm outline-none transition focus:border-navy focus:ring-3 focus:ring-navy/15"
            />
            <button type="submit" className="h-12 rounded-xl bg-navy px-6 text-sm font-bold text-white transition hover:bg-navy-deep">
              Check
            </button>
          </form>
          <AnimatePresence mode="wait">
            {result && (
              <motion.p
                key={result.text}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="status"
                className={`mt-3 text-sm font-semibold ${result.ok ? "text-emerald-700" : "text-rose-600"}`}
              >
                {result.text}
              </motion.p>
            )}
          </AnimatePresence>
          <p className="mt-7 text-xs font-bold tracking-widest text-muted-foreground">WE SHIP TO</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CITIES.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-navy ring-1 ring-peach"
              >
                <MapPin className="size-3.5 text-ember" /> {c}
              </motion.li>
            ))}
            <li className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground">+ every serviceable PIN</li>
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-gradient-to-b from-sky-50 to-white p-6 shadow-sm ring-1 ring-border sm:p-8">
          <h3 className="text-center text-xl font-extrabold text-navy">Better than buying new</h3>
          <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-border">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-3 py-3 text-left font-semibold" scope="col" />
                  <th className="px-3 py-3 font-bold" scope="col">Alpha Mart</th>
                  <th className="px-3 py-3 font-semibold" scope="col">New laptop</th>
                  <th className="px-3 py-3 font-semibold" scope="col">Local shop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-3 py-3 text-left font-semibold text-foreground">{r.label}</th>
                    <td className="bg-emerald-50/60 px-3 py-3"><CellView v={r.us} strong /></td>
                    <td className="px-3 py-3"><CellView v={r.oem} /></td>
                    <td className="px-3 py-3"><CellView v={r.local} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
