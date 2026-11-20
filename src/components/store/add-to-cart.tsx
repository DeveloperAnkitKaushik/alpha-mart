"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStoreEnabled } from "@/components/store/store-flag";
import { useCart } from "@/lib/store/cart-store";
import { useStock } from "@/lib/store/client-data";
import type { Deal } from "@/lib/shop-data";

const MAX_QTY = 10;
const stepBtn = "grid size-11 place-items-center transition hover:bg-cream disabled:opacity-40";

function Controls({ deal, options }: { deal: Deal; options: Record<string, string> }) {
  const stock = useStock();
  const router = useRouter();
  const [wanted, setWanted] = useState(1);
  const cap = stock === undefined ? MAX_QTY : Math.min(stock[deal.id] ?? 0, MAX_QTY);
  const soldOut = cap === 0;
  const qty = Math.min(wanted, Math.max(cap, 1));

  const add = () => {
    useCart.getState().add({ productId: deal.id, options, qty });
    toast.success("Added to cart", { action: { label: "View cart", onClick: () => router.push("/cart") } });
  };

  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="flex items-center overflow-hidden rounded-xl ring-1 ring-border" role="group" aria-label="Quantity">
        <button type="button" aria-label="Decrease quantity" disabled={soldOut || qty <= 1} onClick={() => setWanted(qty - 1)} className={stepBtn}>
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-sm font-bold" aria-live="polite">{qty}</span>
        <button type="button" aria-label="Increase quantity" disabled={soldOut || qty >= cap} onClick={() => setWanted(qty + 1)} className={stepBtn}>
          <Plus className="size-4" />
        </button>
      </div>
      <button
        type="button"
        disabled={soldOut}
        onClick={add}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ember text-base font-bold text-white transition hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground"
      >
        <ShoppingBag className="size-5" /> {soldOut ? "Sold out" : "Add to cart"}
      </button>
    </div>
  );
}

export function AddToCart({ deal, options }: { deal: Deal; options: Record<string, string> }) {
  return useStoreEnabled() ? <Controls deal={deal} options={options} /> : null;
}
