import { motion } from "motion/react";
import type { InboxItem } from "@/lib/dashboard-api";
import { perDay } from "@/lib/inbox";

export function ActivityChart({ items, now }: { items: InboxItem[]; now: number }) {
  const days = perDay(items, now);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((n, d) => n + d.count, 0);

  return (
    <section aria-labelledby="activity-title" className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-border sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="activity-title" className="text-lg font-bold text-navy-deep">Enquiries, last 14 days</h2>
        <p className="text-sm font-semibold text-muted-foreground">{total} total</p>
      </div>
      <ol className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2" aria-label="Enquiries per day">
        {days.map((d, i) => (
          <li key={d.label} className="group relative flex h-full flex-1 flex-col justify-end" aria-label={`${d.label}: ${d.count}`}>
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-navy-deep px-1.5 py-0.5 text-[0.7rem] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <motion.span
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: "easeOut" }}
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              className={`block origin-bottom rounded-t-lg ${d.count ? "bg-navy group-hover:bg-ember" : "bg-peach/60"} transition-colors`}
            />
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-[0.7rem] font-semibold text-muted-foreground" aria-hidden>
        <span>{days[0].label}</span>
        <span>{days[days.length - 1].label}</span>
      </div>
    </section>
  );
}
