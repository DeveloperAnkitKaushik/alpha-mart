import type { InboxItem, Kind, Status } from "./dashboard-api";

export const KIND_LABEL: Record<Kind, string> = { lead: "Enquiry", requirement: "Requirement", callback: "Callback" };
export const STATUS_LABEL: Record<Status, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", won: "Won", lost: "Lost" };

export interface InboxFilter {
  term: string;
  kind: Kind | "all";
  status: Status | "all";
  sort: "newest" | "oldest";
}

export function filterItems(items: InboxItem[], f: InboxFilter): InboxItem[] {
  const term = f.term.trim().toLowerCase();
  const out = items.filter(
    (i) =>
      (f.kind === "all" || i.kind === f.kind) &&
      (f.status === "all" || i.status === f.status) &&
      (!term || `${i.name} ${i.phone} ${i.title} ${i.notes}`.toLowerCase().includes(term)),
  );
  return f.sort === "oldest" ? out.reverse() : out;
}

const DAY = 86_400_000;
const rtf = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });

export function relativeTime(ms: number, now: number): string {
  const s = Math.round((ms - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < DAY / 1000) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / (DAY / 1000)), "day");
}

export function perDay(items: InboxItem[], now: number, days = 14): { label: string; count: number }[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const first = start.getTime() - (days - 1) * DAY;
  const buckets = Array.from({ length: days }, (_, i) => ({
    label: new Date(first + i * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    count: 0,
  }));
  for (const i of items) {
    const idx = Math.floor((i.createdAt - first) / DAY);
    if (idx >= 0 && idx < days) buckets[idx].count++;
  }
  return buckets;
}

// Visitor text is untrusted: a leading = + - @ would run as a spreadsheet formula.
const cell = (v: string) => `"${v.replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`;

export function downloadCsv(items: InboxItem[]) {
  const header = ["Type", "Name", "Phone", "Product / title", "Status", "Notes", "Created", "Details"];
  const rows = items.map((i) => [
    KIND_LABEL[i.kind],
    i.name,
    i.phone,
    i.title,
    STATUS_LABEL[i.status],
    i.notes,
    i.createdAt ? new Date(i.createdAt).toISOString() : "",
    i.fields.map(([k, v]) => `${k}: ${v}`).join("; "),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `alpha-mart-inbox-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
