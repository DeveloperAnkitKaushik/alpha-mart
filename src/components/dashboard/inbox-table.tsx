import { memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Inbox } from "lucide-react";
import type { InboxItem, Status } from "@/lib/dashboard-api";
import { relativeTime } from "@/lib/inbox";
import { ContactLinks, KindBadge, StatusSelect } from "./badges";

interface RowProps {
  item: InboxItem;
  now: number;
  onOpen: (key: string) => void;
  onStatus: (item: InboxItem, s: Status) => void;
}

const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

const Row = memo(function Row({ item, now, onOpen, onStatus }: RowProps) {
  return (
    <motion.tr layout {...fade} onClick={() => onOpen(item.key)} className="cursor-pointer border-t border-border hover:bg-cream/60">
      <td className="py-3 pr-3 pl-5"><KindBadge kind={item.kind} /></td>
      <td className="px-3 py-3">
        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(item.key); }} className="text-left font-bold text-navy-deep hover:text-ember focus-visible:underline focus-visible:outline-none">
          {item.name}
        </button>
        <p className="text-xs text-muted-foreground tabular-nums">{item.phone}</p>
      </td>
      <td className="max-w-72 px-3 py-3"><p className="truncate text-sm" title={item.title}>{item.title}</p></td>
      <td className="px-3 py-3"><ContactLinks name={item.name} phone={item.phone} /></td>
      <td className="px-3 py-3"><StatusSelect value={item.status} label={`Status for ${item.name}`} onChange={(s) => onStatus(item, s)} /></td>
      <td className="py-3 pr-5 pl-3 text-right text-xs whitespace-nowrap text-muted-foreground">
        {item.createdAt ? relativeTime(item.createdAt, now) : "—"}
      </td>
    </motion.tr>
  );
});

const Card = memo(function Card({ item, now, onOpen, onStatus }: RowProps) {
  return (
    <motion.li layout {...fade} className="rounded-2xl bg-white p-4 ring-1 ring-border">
      <div className="flex items-center justify-between gap-2">
        <KindBadge kind={item.kind} />
        <span className="text-xs text-muted-foreground">{item.createdAt ? relativeTime(item.createdAt, now) : "—"}</span>
      </div>
      <button type="button" onClick={() => onOpen(item.key)} className="mt-3 flex w-full items-center justify-between gap-2 text-left">
        <span className="min-w-0">
          <span className="block font-bold text-navy-deep">{item.name}</span>
          <span className="block truncate text-sm text-muted-foreground">{item.title}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <div className="mt-3 flex items-center justify-between gap-2">
        <ContactLinks name={item.name} phone={item.phone} />
        <StatusSelect value={item.status} label={`Status for ${item.name}`} onChange={(s) => onStatus(item, s)} />
      </div>
    </motion.li>
  );
});

export function InboxTable({ items, ...rest }: Omit<RowProps, "item"> & { items: InboxItem[] }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-white py-16 text-muted-foreground">
        <Inbox className="size-8" aria-hidden />
        <p>Nothing matches these filters.</p>
      </div>
    );
  }
  return (
    <>
      <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border md:block">
        <table className="w-full text-left">
          <caption className="sr-only">Enquiries and requirements</caption>
          <thead className="bg-cream/70 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="py-3 pr-3 pl-5">Type</th>
              <th scope="col" className="px-3 py-3">Name</th>
              <th scope="col" className="px-3 py-3">Product / title</th>
              <th scope="col" className="px-3 py-3">Contact</th>
              <th scope="col" className="px-3 py-3">Status</th>
              <th scope="col" className="py-3 pr-5 pl-3 text-right">Received</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {items.map((i) => <Row key={i.key} item={i} {...rest} />)}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        <AnimatePresence initial={false}>
          {items.map((i) => <Card key={i.key} item={i} {...rest} />)}
        </AnimatePresence>
      </ul>
    </>
  );
}
