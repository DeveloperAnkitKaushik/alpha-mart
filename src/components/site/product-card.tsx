import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { CATEGORY_VISUALS } from "@/components/site/category-tile";
import { productPhoto } from "@/lib/sub-images";
import { formatPrice, type CategoryId, type Product } from "@/lib/data";

export function ProductCard({ product: p }: { product: Product }) {
  const photo = productPhoto(p.id, p.subcategory);
  const Icon = photo ? undefined : CATEGORY_VISUALS[p.category as CategoryId]?.icon;
  return (
    <Link
      href={`/product/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_20px_50px_-20px] hover:shadow-brand/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={photo ?? p.image}
          alt={p.name}
          fill
          unoptimized
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {Icon && (
          <Icon
            aria-hidden
            className="absolute inset-0 m-auto size-20 text-white/80 drop-shadow-lg transition duration-500 group-hover:scale-110 group-hover:-rotate-6"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-xs backdrop-blur">
          MOQ {p.moq}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-medium leading-snug">{p.name}</h3>
        <p className="text-lg font-semibold text-brand">
          {formatPrice(p.priceMin)}
          <span className="text-sm font-normal text-muted-foreground"> / {p.unit}</span>
        </p>
        <div className="mt-auto space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 text-foreground">
            {p.supplier.name}
            {p.supplier.verified && <BadgeCheck className="size-3.5 text-brand" aria-label="Verified" />}
          </p>
          <p className="flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="size-3" />{p.supplier.city}</span>
            <span className="flex items-center gap-1"><Star className="size-3 fill-current" />{p.supplier.rating}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
