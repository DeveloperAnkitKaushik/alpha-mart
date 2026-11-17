import Image from "next/image";
import { Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopImage({ src, fit = "contain", className }: { src?: string; fit?: "contain" | "cover"; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-white", className)}>
      {src ? (
        <Image src={src} alt="" fill unoptimized sizes="300px" className={cn("transition duration-500 group-hover:scale-105", fit === "cover" ? "object-cover" : "object-contain p-2")} />
      ) : (
        <span className="grid size-full place-items-center bg-gradient-to-br from-peach to-cream text-navy/60">
          <Laptop className="size-1/3" />
        </span>
      )}
    </span>
  );
}
