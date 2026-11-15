import type { MouseEvent } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUSES, type Kind, type Status } from "@/lib/dashboard-api";
import { KIND_LABEL, STATUS_LABEL } from "@/lib/inbox";

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-ember/15 text-ember ring-ember/30",
  contacted: "bg-skyblue/10 text-skyblue ring-skyblue/25",
  quoted: "bg-peach text-navy-deep ring-ember/20",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  lost: "bg-muted text-muted-foreground ring-border",
};

const KIND_STYLE: Record<Kind, string> = {
  lead: "bg-navy text-white",
  requirement: "bg-cream text-navy ring-1 ring-peach",
  callback: "bg-ember text-white",
};

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap";

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className={cn(pill, "ring-1", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
);

export const KindBadge = ({ kind }: { kind: Kind }) => <span className={cn(pill, KIND_STYLE[kind])}>{KIND_LABEL[kind]}</span>;

export function StatusSelect({
  value,
  onChange,
  label,
  disabled,
}: {
  value: Status;
  onChange: (s: Status) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as Status)}
      className={cn(
        "h-11 cursor-pointer sm:h-9 rounded-full border-0 px-3 text-xs font-bold ring-1 outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-60",
        STATUS_STYLE[value],
      )}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function ContactLinks({ name, phone }: { name: string; phone: string }) {
  const stop = (e: MouseEvent) => e.stopPropagation();
  return (
    <span className="flex items-center gap-1.5">
      <a
        href={`tel:+91${phone}`}
        onClick={stop}
        aria-label={`Call ${name}`}
        className="grid size-11 place-items-center sm:size-9 rounded-full bg-navy/10 text-navy transition-colors hover:bg-navy hover:text-white"
      >
        <Phone className="size-4" />
      </a>
      <a
        href={`https://wa.me/91${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop}
        aria-label={`WhatsApp ${name}`}
        className="grid size-11 place-items-center sm:size-9 rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
      >
        <MessageCircle className="size-4" />
      </a>
    </span>
  );
}
