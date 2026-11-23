"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { setOrderStatus, type listOrders } from "@/lib/store/admin-actions";
import { STAFF_NEXT, type OrderStatus } from "@/lib/store/order-state";
import { OrderStatusBadge } from "../badges";
import { unwrap } from "./admin-call";

type AdminOrder = Extract<Awaited<ReturnType<typeof listOrders>>, { ok: true }>["orders"][number];

const fieldLabel = "text-xs font-bold tracking-wider text-muted-foreground uppercase";

function StatusForm({ order, onDone }: { order: AdminOrder; onDone: () => void }) {
  const next = STAFF_NEXT[order.status];
  const [to, setTo] = useState<OrderStatus | "">("");
  const [note, setNote] = useState(order.trackingNote);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: async () => unwrap(await setOrderStatus(order.id, to as OrderStatus, note.trim())),
    onSuccess: () => {
      toast.success("Order updated");
      void client.invalidateQueries({ queryKey: ["admin-orders"] });
      onDone();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!next.length) return <p className="text-sm text-muted-foreground">No further status changes are possible for this order.</p>;
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <label className="block">
        <span className={fieldLabel}>Move to</span>
        <select value={to} onChange={(e) => setTo(e.target.value as OrderStatus)} className="mt-2 h-11 w-full rounded-xl border border-input bg-white px-3 text-sm font-semibold">
          <option value="">Choose a status</option>
          {next.map((s) => <option key={s} value={s}>{s.replace(/^./, (c) => c.toUpperCase())}</option>)}
        </select>
      </label>
      {to === "cancelled" && <p className="rounded-xl bg-cream px-3 py-2 text-sm text-navy">Cancelling puts these units back in stock.</p>}
      <label className="block">
        <span className={fieldLabel}>Tracking note</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} placeholder="Courier name, tracking number…" className="mt-2 w-full rounded-2xl border border-border bg-cream/50 p-3 text-sm outline-none focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/30" />
      </label>
      <button type="submit" disabled={!to || save.isPending} className="h-11 w-full rounded-full bg-ember text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none disabled:opacity-50">
        {save.isPending ? "Saving…" : "Update order"}
      </button>
    </form>
  );
}

export function OrderDrawer({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const a = order?.address;
  return (
    <DialogPrimitive.Root open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-navy-deep/30 backdrop-blur-xs duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl duration-300 outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right sm:rounded-l-3xl">
          {order && a && (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-border bg-cream p-5">
                <div className="min-w-0">
                  <OrderStatusBadge status={order.status} />
                  <DialogPrimitive.Title className="mt-2 text-xl font-extrabold text-navy-deep">{a.name}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm break-words text-muted-foreground">
                    {order.email ?? "No email"} · {formatPrice(order.total)}
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close aria-label="Close order" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none">
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </header>
              <div className="space-y-6 p-5">
                <section>
                  <h3 className={fieldLabel}>Deliver to</h3>
                  <address className="mt-2 text-sm not-italic">
                    {a.name}, +91 {a.phone}<br />
                    {a.line1}{a.line2 && `, ${a.line2}`}<br />
                    {a.city}, {a.state} {a.pincode}
                  </address>
                </section>
                <section>
                  <h3 className={fieldLabel}>Items</h3>
                  <ul className="mt-2 divide-y divide-border text-sm">
                    {order.items.map((l, i) => (
                      <li key={`${l.productId}-${i}`} className="py-2">
                        <span className="font-semibold">{l.name}</span> × {l.qty}
                        {Object.keys(l.options).length > 0 && <span className="block text-xs text-muted-foreground">{Object.values(l.options).join(" · ")}</span>}
                      </li>
                    ))}
                  </ul>
                  {order.couponCode && <p className="mt-2 text-xs text-muted-foreground">Coupon {order.couponCode}: −{formatPrice(order.discount)}</p>}
                </section>
                <StatusForm key={`${order.id}:${order.status}`} order={order} onDone={onClose} />
              </div>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
