"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ShopImage } from "@/components/shop/shop-image";
import { SectionHeading } from "@/components/shop/decor";
import { Reveal } from "@/components/site/reveal";
import { BUDGETS } from "@/lib/shop-data";
import { useSiteContent } from "@/components/site/site-content";

export function ShopByCategory() {
  const categories = useSiteContent().categories;
  if (!categories.length) return null;
  return (
    <section className="container-x py-12">
      <SectionHeading title="Shop by" accent="Category" sub="Certified refurbished tech for every need" />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.06}>
            <Link
              href={`/collections/${c.slug}`}
              className="group flex flex-col items-center rounded-t-[999px] rounded-b-3xl border-2 border-amber-300/70 bg-gradient-to-b from-amber-50 to-cream p-3 pb-5 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-ember hover:shadow-xl hover:shadow-ember/15"
            >
              <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-t-[999px] rounded-b-2xl bg-white ring-1 ring-amber-100">
                <ShopImage src={c.image} fit={c.fit} className="absolute inset-0 size-full" />
              </span>
              <span className="mt-3 text-center text-sm font-bold text-foreground">{c.label}</span>
              <span className="mt-1 flex items-center gap-1 text-xs font-bold text-navy group-hover:text-ember">
                Shop Now <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ShopByBudget() {
  return (
    <section className="bg-gradient-to-b from-cream via-peach/60 to-cream py-14">
      <div className="container-x">
        <SectionHeading title="Shop by" accent="Budget" sub="Great devices at every price point" />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {BUDGETS.map((b, i) => (
            <Reveal key={b.limit} delay={i * 0.08}>
              <Link
                href={b.href}
                className="group block rounded-3xl bg-gradient-to-b from-white to-amber-50 p-4 text-center shadow-md ring-1 ring-peach transition duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <p className="text-xs font-semibold text-muted-foreground">{b.label}</p>
                <p className="text-3xl font-black text-navy sm:text-4xl">{b.limit}</p>
                <span className="relative my-4 block aspect-[4/3] overflow-hidden rounded-2xl bg-white shadow-inner ring-1 ring-peach">
                  <ShopImage src={b.image} className="absolute inset-0 size-full" />
                  <Flame className="absolute bottom-2 left-2 size-5 text-ember/80" aria-hidden />
                  <Flame className="absolute right-2 bottom-2 size-5 text-ember/80" aria-hidden />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-navy px-5 py-2 text-xs font-bold text-white shadow transition group-hover:bg-navy-deep">
                  Shop Now <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
