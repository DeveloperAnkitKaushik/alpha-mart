"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, TicketPercent } from "lucide-react";
import { StateCard } from "@/components/site/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listCoupons, saveCoupon } from "@/lib/store/admin-actions";
import { couponCodeSchema, couponSchema, type Coupon } from "@/lib/store/schemas";
import { addBtn, inputClass, Label, Toggle } from "../items/fields";
import { AdminError, unwrap } from "./admin-call";

type Row = Coupon & { code: string };
type Form = { code: string; type: Coupon["type"]; value: string; maxDiscount: string; minOrder: string; expiresAt: string; active: boolean; maxUses: string; oncePerCustomer: boolean };

const BLANK: Form = { code: "", type: "flat", value: "", maxDiscount: "", minOrder: "0", expiresAt: "", active: true, maxUses: "", oncePerCustomer: false };
const toForm = (c: Row): Form => ({ ...c, value: String(c.value), maxDiscount: c.maxDiscount?.toString() ?? "", minOrder: String(c.minOrder), maxUses: c.maxUses?.toString() ?? "" });
const orNull = (s: string) => (s.trim() === "" ? null : Number(s));

function CouponDialog({ initial, uses, onClose }: { initial: Form; uses: number | null; onClose: () => void }) {
  const [f, setF] = useState(initial);
  const client = useQueryClient();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = useMutation({
    mutationFn: async () => {
      const code = couponCodeSchema.safeParse(f.code);
      if (!code.success) throw new Error("Code must be 3 to 20 letters or digits.");
      const parsed = couponSchema.omit({ uses: true }).safeParse({
        type: f.type, value: Number(f.value), maxDiscount: orNull(f.maxDiscount), minOrder: Number(f.minOrder),
        expiresAt: f.expiresAt, active: f.active, maxUses: orNull(f.maxUses), oncePerCustomer: f.oncePerCustomer,
      });
      if (!parsed.success) throw new Error("Check the numbers and the expiry date.");
      return unwrap(await saveCoupon(code.data, parsed.data));
    },
    onSuccess: () => {
      toast.success("Coupon saved");
      void client.invalidateQueries({ queryKey: ["admin-coupons"] });
      void client.invalidateQueries({ queryKey: ["coupon-exists"] });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-navy-deep">{uses === null ? "New coupon" : "Edit coupon"}</DialogTitle>
          <DialogDescription>{uses === null ? "Customers type this code at checkout." : `Used ${uses} time${uses === 1 ? "" : "s"} so far.`}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Label text="Code" hint="letters and digits">
            <input value={f.code} disabled={uses !== null} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={20} className={inputClass} />
          </Label>
          <Label text="Type">
            <select value={f.type} onChange={(e) => set("type", e.target.value as Coupon["type"])} className={inputClass}>
              <option value="flat">Flat ₹ off</option>
              <option value="percent">Percent off</option>
            </select>
          </Label>
          <Label text={f.type === "flat" ? "Amount (₹)" : "Percent"}>
            <input type="number" inputMode="numeric" min={1} value={f.value} onChange={(e) => set("value", e.target.value)} className={inputClass} />
          </Label>
          <Label text="Max discount (₹)" hint="empty = no cap">
            <input type="number" inputMode="numeric" min={1} value={f.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} className={inputClass} />
          </Label>
          <Label text="Minimum order (₹)">
            <input type="number" inputMode="numeric" min={0} value={f.minOrder} onChange={(e) => set("minOrder", e.target.value)} className={inputClass} />
          </Label>
          <Label text="Valid through" hint="end of that day, IST">
            <input type="date" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputClass} />
          </Label>
          <Label text="Max total uses" hint="empty = unlimited">
            <input type="number" inputMode="numeric" min={1} value={f.maxUses} onChange={(e) => set("maxUses", e.target.value)} className={inputClass} />
          </Label>
          <div className="flex flex-col justify-end">
            <Toggle checked={f.oncePerCustomer} onChange={(v) => set("oncePerCustomer", v)} label="Once per customer" />
            <Toggle checked={f.active} onChange={(v) => set("active", v)} label={f.active ? "Active" : "Inactive"} />
          </div>
          <button type="submit" disabled={save.isPending} className="h-11 rounded-full bg-ember text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none disabled:opacity-50 sm:col-span-2">
            {save.isPending ? "Saving…" : "Save coupon"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CouponsTab() {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const q = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => unwrap(await listCoupons()).coupons,
    retry: false,
  });

  return (
    <section aria-labelledby="coupons-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="coupons-title" className="text-xl font-extrabold text-navy-deep">Coupons</h2>
        <button type="button" onClick={() => setEditing("new")} className={addBtn}><Plus className="size-4" /> New coupon</button>
      </div>
      {q.isError ? (
        <AdminError what="coupons" error={q.error} retry={() => void q.refetch()} />
      ) : !q.data ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : q.data.length === 0 ? (
        <StateCard icon={TicketPercent} title="No coupons yet" />
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border">
          {q.data.map((c) => (
            <li key={c.code} className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 first:border-t-0">
              <div className="min-w-0">
                <p className="font-bold text-navy-deep">{c.code} <span className="text-xs font-semibold text-muted-foreground">{c.active ? "" : "· inactive"}</span></p>
                <p className="text-xs text-muted-foreground">
                  {c.type === "flat" ? `₹${c.value} off` : `${c.value}% off`} · min ₹{c.minOrder} · until {c.expiresAt} · {c.uses}{c.maxUses !== null ? `/${c.maxUses}` : ""} used
                </p>
              </div>
              <button type="button" onClick={() => setEditing(c)} className="h-11 shrink-0 rounded-full px-4 text-sm font-bold text-navy ring-1 ring-border hover:bg-cream">Edit</button>
            </li>
          ))}
        </ul>
      )}
      {editing && <CouponDialog key={editing === "new" ? "new" : editing.code} initial={editing === "new" ? BLANK : toForm(editing)} uses={editing === "new" ? null : editing.uses} onClose={() => setEditing(null)} />}
    </section>
  );
}
