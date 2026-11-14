"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { BadgeCheck, Clock, MapPin, Star } from "lucide-react";
import { productPhoto } from "@/lib/sub-images";
import { LeadDialog } from "@/components/site/lead-dialog";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProduct } from "@/lib/api";
import { CATEGORIES, formatPrice } from "@/lib/data";

export function ProductView({ id }: { id: string }) {
  const { data: p, isPending } = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });

  if (isPending) return <Skeleton className="mx-auto mt-32 h-96 max-w-5xl rounded-3xl" />;
  if (!p) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-20 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <Link href="/search" className="mt-4 inline-block text-brand underline-offset-4 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-10 pb-24 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border"
      >
        <Image src={productPhoto(p.id, p.subcategory) ?? p.image} alt={p.name} fill priority unoptimized sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <div>
          <Link href={`/search?category=${p.category}`} className="text-sm text-brand hover:underline">
            {CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category}
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.name}</h1>
        </div>
        <p className="text-3xl font-semibold text-brand">
          {formatPrice(p.priceMin)} – {formatPrice(p.priceMax)}
          <span className="text-base font-normal text-muted-foreground"> / {p.unit}</span>
        </p>
        <p className="text-muted-foreground">{p.description}</p>
        <p className="text-sm">
          Minimum order: <strong>{p.moq}</strong>
        </p>

        <div className="space-y-2 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 font-medium">
            {p.supplier.name}
            {p.supplier.verified && <BadgeCheck className="size-4 text-brand" aria-label="Verified supplier" />}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{p.supplier.city}</span>
            <span className="flex items-center gap-1"><Star className="size-3.5 fill-current" />{p.supplier.rating} rating</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{p.supplier.years} yrs in business</span>
          </p>
        </div>

        <div className="space-y-3">
          <LeadDialog product={p} />
          <WhatsAppButton product={p} />
        </div>
      </motion.div>
    </div>
  );
}
