"use client";

import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSiteContent } from "@/components/site/site-content";
import { setStock } from "@/lib/store/admin-actions";
import { useStock } from "@/lib/store/client-data";
import { inputClass } from "../items/fields";
import { unwrap } from "./admin-call";

const Row = memo(function Row({ id, name, available }: { id: string; name: string; available: number }) {
  const [value, setValue] = useState(String(available));
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: async () => unwrap(await setStock(id, Number(value), available)),
    onSuccess: () => {
      toast.success("Stock saved");
      void client.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const valid = value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 999;

  return (
    <li className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
      <label htmlFor={`stock-${id}`} className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-deep" title={name}>{name}</label>
      <input id={`stock-${id}`} type="number" inputMode="numeric" min={0} max={999} value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClass} w-24 shrink-0`} />
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={!valid || value === String(available) || save.isPending}
        className="h-11 shrink-0 rounded-full bg-navy px-5 text-sm font-bold text-white transition hover:bg-navy-deep focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none disabled:opacity-50"
      >
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </li>
  );
});

export function StockTab() {
  const products = useSiteContent().products;
  const stock = useStock();
  return (
    <section aria-labelledby="stock-title" className="space-y-4">
      <h2 id="stock-title" className="text-xl font-extrabold text-navy-deep">Stock</h2>
      <p className="text-sm text-muted-foreground">Units available per product. A product with no entry counts as 0 and can&apos;t be bought.</p>
      <ul className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border">
        {products.map((p) => <Row key={`${p.id}:${stock?.[p.id] ?? 0}`} id={p.id} name={p.name} available={stock?.[p.id] ?? 0} />)}
      </ul>
    </section>
  );
}
