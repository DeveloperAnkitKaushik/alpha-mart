import { CheckCircle2, ClipboardList, Inbox, PhoneCall, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CountUp from "@/components/CountUp";
import type { InboxItem } from "@/lib/dashboard-api";

interface Kpi {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
}

function kpis(items: InboxItem[]): Kpi[] {
  const count = (pred: (i: InboxItem) => boolean) => items.filter(pred).length;
  const won = count((i) => i.status === "won");
  return [
    { label: "Total enquiries", value: items.length, hint: `${count((i) => i.kind === "lead")} from product pages`, icon: Inbox, accent: "bg-navy text-white" },
    { label: "New", value: count((i) => i.status === "new"), hint: "Not contacted yet", icon: Sparkles, accent: "bg-ember text-white" },
    { label: "Requirements", value: count((i) => i.kind === "requirement"), hint: "Posted from /requirement", icon: ClipboardList, accent: "bg-peach text-navy-deep" },
    { label: "Callbacks", value: count((i) => i.kind === "callback"), hint: "From the footer form", icon: PhoneCall, accent: "bg-skyblue text-white" },
    {
      label: "Conversion",
      value: items.length ? Math.round((won / items.length) * 100) : 0,
      suffix: "%",
      hint: `${won} won`,
      icon: CheckCircle2,
      accent: "bg-emerald-600 text-white",
    },
  ];
}

export function KpiCards({ items }: { items: InboxItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {kpis(items).map((k) => (
        <li key={k.label} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-border last:col-span-2 sm:p-5 lg:last:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{k.label}</p>
            <span className={`grid size-8 place-items-center rounded-full ${k.accent}`} aria-hidden>
              <k.icon className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-navy-deep tabular-nums sm:text-4xl">
            <CountUp to={k.value} suffix={k.suffix} separator="," duration={1.2} trigger="load" />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
        </li>
      ))}
    </ul>
  );
}
