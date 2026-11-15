import Image from "next/image";
import { Laptop, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOP_IMAGES } from "@/lib/shop-images";
import type { ShopImageKey } from "@/lib/shop-data";

const DESKTOP_KEYS: ShopImageKey[] = ["desktop-pc", "all-in-one-pc"];

export function ShopImage({ name, index = 0, fit = "contain", className }: { name: ShopImageKey; index?: number; fit?: "contain" | "cover"; className?: string }) {
  const photos = SHOP_IMAGES[name];
  const src = photos?.[index] ?? photos?.[0];
  const Icon = DESKTOP_KEYS.includes(name) ? Monitor : Laptop;
  return (
    <span className={cn("relative block overflow-hidden bg-white", className)}>
      {src ? (
        <Image src={src} alt="" fill unoptimized sizes="300px" className={cn("transition duration-500 group-hover:scale-105", fit === "cover" ? "object-cover" : "object-contain p-2")} />
      ) : (
        <span className="grid size-full place-items-center bg-gradient-to-br from-peach to-cream text-navy/60">
          <Icon className="size-1/3" />
        </span>
      )}
    </span>
  );
}
