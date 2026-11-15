"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { STATUSES, updateItem, type InboxItem, type Status } from "@/lib/dashboard-api";
import { STATUS_LABEL } from "@/lib/inbox";
import { ContactLinks, KindBadge } from "./badges";

function Editor({ item }: { item: InboxItem }) {
  const [status, setStatus] = useState<Status>(item.status);
  const [notes, setNotes] = useState(item.notes);
  const save = useMutation({
    mutationFn: () => updateItem(item, { status, notes: notes.trim() }, useAuth.getState().user?.uid ?? ""),
    onSuccess: () => toast.success("Saved"),
    onError: () => toast.error("Could not save. Check your staff access."),
  });
  const dirty = status !== item.status || notes.trim() !== item.notes;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <fieldset>
        <legend className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Status</legend>
        <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl bg-cream p-1.5">
          {STATUSES.map((s) => (
            <label
              key={s}
              className={cn(
                "flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-navy",
                status === s ? "bg-navy text-white shadow-sm" : "text-navy-deep hover:bg-white",
              )}
            >
              <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
              {STATUS_LABEL[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Call outcome, quoted price, follow-up date…"
          className="mt-2 w-full rounded-2xl border border-border bg-cream/50 p-3 text-sm outline-none focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/30"
        />
      </label>
      <button
        type="submit"
        disabled={!dirty || save.isPending}
        className="h-11 w-full rounded-full bg-ember text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none disabled:opacity-50"
      >
        {save.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function DetailDrawer({ item, onClose }: { item: InboxItem | null; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-navy-deep/30 backdrop-blur-xs duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl duration-300 outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right sm:rounded-l-3xl">
          {item && (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-border bg-cream p-5">
                <div className="min-w-0">
                  <KindBadge kind={item.kind} />
                  <DialogPrimitive.Title className="mt-2 text-xl font-extrabold text-navy-deep">{item.name}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm text-muted-foreground tabular-nums">
                    +91 {item.phone}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close aria-label="Close details" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none">
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </header>
              <div className="space-y-6 p-5">
                <ContactLinks name={item.name} phone={item.phone} />
                <dl className="divide-y divide-border rounded-2xl ring-1 ring-border">
                  {item.fields.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 px-4 py-3 text-sm">
                      <dt className="font-semibold text-muted-foreground">{k}</dt>
                      <dd className="break-words whitespace-pre-line text-navy-deep">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Editor key={`${item.key}:${item.status}:${item.notes}`} item={item} />
              </div>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
