"use client";

import { MessageCircle } from "lucide-react";
import type { Product } from "@/lib/data";

export function WhatsAppButton({ product: p }: { product: Product }) {
  const open = () => {
    const text = `Hi ${p.supplier.name}, I'm interested in "${p.name}" (${window.location.href}). Please share your best price and availability.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={open}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-medium text-white transition hover:brightness-95 active:translate-y-px"
    >
      <MessageCircle className="size-5" />
      Chat on WhatsApp
    </button>
  );
}
