import { Download, Search } from "lucide-react";
import { STATUSES } from "@/lib/dashboard-api";
import { KIND_LABEL, STATUS_LABEL, type InboxFilter } from "@/lib/inbox";

const selectClass =
  "h-11 rounded-full border border-border bg-cream/50 px-4 text-sm font-semibold text-navy-deep outline-none focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/30";

export function InboxToolbar({
  filter,
  onChange,
  shown,
  onExport,
}: {
  filter: InboxFilter;
  onChange: (patch: Partial<InboxFilter>) => void;
  shown: number;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <label className="relative flex-1">
        <span className="sr-only">Search inbox</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={filter.term}
          onChange={(e) => onChange({ term: e.target.value })}
          placeholder="Search name, phone, product or notes"
          className="h-11 w-full rounded-full border border-border bg-cream/50 pr-4 pl-10 text-sm outline-none focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/30"
        />
      </label>
      <div className="grid grid-cols-3 gap-2 sm:flex">
        <select aria-label="Filter by type" value={filter.kind} onChange={(e) => onChange({ kind: e.target.value as InboxFilter["kind"] })} className={selectClass}>
          <option value="all">All types</option>
          {Object.entries(KIND_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select aria-label="Filter by status" value={filter.status} onChange={(e) => onChange({ status: e.target.value as InboxFilter["status"] })} className={selectClass}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select aria-label="Sort" value={filter.sort} onChange={(e) => onChange({ sort: e.target.value as InboxFilter["sort"] })} className={selectClass}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      <button
        type="button"
        onClick={onExport}
        disabled={shown === 0}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-bold text-white transition-colors hover:bg-navy-deep focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none disabled:opacity-50"
      >
        <Download className="size-4" /> Export CSV ({shown})
      </button>
    </div>
  );
}
