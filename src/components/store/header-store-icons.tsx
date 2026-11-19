"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useStoreEnabled } from "@/components/store/store-flag";
import { useCartCount } from "@/lib/store/cart-store";

function CartCount() {
  const count = useCartCount();
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-ember px-1 text-[10px] leading-4 font-bold text-white">
      {count}
    </span>
  );
}

export function HeaderStoreIcons({ iconClass }: { iconClass: string }) {
  const enabled = useStoreEnabled();
  if (!enabled) return null;
  return (
    <>
      <Link href="/favorites" aria-label="Favourites" className={iconClass}>
        <Heart className="size-5" />
      </Link>
      <Link href="/cart" aria-label="Cart" className={`${iconClass} relative`}>
        <ShoppingBag className="size-5" />
        <CartCount />
      </Link>
    </>
  );
}
