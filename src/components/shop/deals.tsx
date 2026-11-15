"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Flame, RotateCcw, ShieldCheck, Star, Truck, Users, Wallet } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { LeadDialog } from "@/components/site/lead-dialog";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { DEALS, dealToProduct, discountPct, type Deal } from "@/lib/shop-data";
import { formatPrice } from "@/lib/data";

const PERKS = [
  { icon: ShieldCheck, label: "6 Month Warranty" },
  { icon: BadgeCheck, label: "Quality Tested" },
  { icon: Truck, label: "Fast & Safe Delivery" },
  { icon: RotateCcw, label: "15 Days Replace" },
];

const PROMISES = [
  { icon: Wallet, label: "Unbeatable Prices" },
  { icon: BadgeCheck, label: "Certified Refurbished" },
  { icon: Users, label: "Trust of Thousands" },
];

export function DealCard({ deal }: { deal: Deal }) {
  const product = dealToProduct(deal);
  return (
    <article className="group flex shrink-0 basis-[82%] snap-start flex-col rounded-2xl border border-border bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] 2xl:basis-[calc((100%-3rem)/4)]">
      <Link href={`/product/${deal.id}`} className="relative block">
        <ShopImage name={deal.image} className="aspect-[4/3] rounded-xl" />
        <span className="absolute top-2 left-2 rounded-md bg-navy px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">{deal.tag}</span>
        <span className="absolute top-2 right-2 rounded-md bg-ember px-2 py-0.5 text-[10px] font-bold text-white">{discountPct(deal)}% OFF</span>
      </Link>
      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm leading-snug font-bold text-foreground">
        <Link href={`/product/${deal.id}`} className="hover:text-navy">{deal.name}</Link>
      </h3>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="size-3.5 fill-amber-400 text-amber-400" /> {deal.rating.toFixed(1)} ({deal.reviews})
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {deal.spec.map((s) => (
          <span key={s} className="rounded-md bg-cream px-2 py-0.5 text-[11px] font-medium text-navy ring-1 ring-peach">{s}</span>
        ))}
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-foreground">{formatPrice(deal.price)}</span>
        <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.mrp)}</span>
        <span className="rounded bg-emerald-50 px-1.5 text-[11px] font-bold text-emerald-700">{discountPct(deal)}% off</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[...deal.ram, ...deal.ssd].map((s) => (
          <span key={s} className="rounded-full border border-navy/20 px-2 py-0.5 text-[11px] text-navy/80">{s}</span>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 text-[11px] font-medium">
        <span className="text-emerald-700">✓ Free 6 Month Wty</span>
        <span className="text-rose-600">Ships Within 1–3 Days</span>
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <LeadDialog product={product} className="h-10 rounded-lg bg-navy text-sm hover:bg-navy-deep" />
        <WhatsAppButton product={product} compact className="h-10 w-10 rounded-lg px-0" />
      </div>
    </article>
  );
}

export function DealRail({ deals, dark }: { deals: Deal[]; dark?: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: true });
  const sync = () => {
    const el = rail.current;
    if (el) setEdge({ left: el.scrollLeft > 8, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 });
  };
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.9, behavior: "smooth" });

  return (
    <div className="relative min-w-0">
      <div ref={rail} onScroll={sync} className="flex snap-x gap-4 overflow-x-auto scroll-smooth py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
      {(
        [
          { dir: -1, Icon: ChevronLeft, label: "Previous", pos: "-left-4", show: edge.left },
          { dir: 1, Icon: ChevronRight, label: "Next", pos: "-right-4", show: edge.right },
        ] as const
      ).map(({ dir, Icon, label, pos, show }) =>
        show ? (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => scroll(dir)}
            className={`absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full shadow-lg ring-1 transition sm:grid ${pos} ${
              dark ? "bg-white text-navy ring-white/20 hover:bg-ember hover:text-white" : "bg-white ring-border hover:bg-navy hover:text-white"
            }`}
          >
            <Icon className="size-5" />
          </button>
        ) : null,
      )}
    </div>
  );
}

export function Deals() {
  return (
    <section id="deals" className="container-x scroll-mt-28 py-10">
      <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-center">
        <Reveal className="rounded-3xl bg-gradient-to-b from-peach/60 to-cream p-6 ring-1 ring-peach">
          <p className="text-sm font-bold text-ember italic">Exclusive</p>
          <h2 className="mt-1 flex items-center gap-2 text-4xl leading-none font-black text-navy">
            DEALS <Flame className="size-8 text-ember" />
          </h2>
          <p className="text-4xl leading-tight font-black text-navy">OF THE DAY</p>
          <p className="mt-3 inline-block rounded-md bg-navy px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
            BEST LAPTOP OFFERS · LIMITED TIME ONLY!
          </p>
          <ul className="mt-5 grid grid-cols-4 gap-2 lg:grid-cols-2">
            {PERKS.map((p) => (
              <li key={p.label} className="flex flex-col items-center gap-1.5 text-center text-[11px] leading-tight font-semibold text-navy/80">
                <span className="grid size-11 place-items-center rounded-full bg-white shadow-sm ring-1 ring-peach">
                  <p.icon className="size-5 text-navy" />
                </span>
                {p.label}
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-1.5 border-t border-peach pt-4">
            {PROMISES.map((p) => (
              <li key={p.label} className="flex items-center gap-2 text-xs font-semibold text-navy">
                <p.icon className="size-4 text-ember" /> {p.label}
              </li>
            ))}
          </ul>
        </Reveal>
        <DealRail deals={DEALS} />
      </div>
    </section>
  );
}
