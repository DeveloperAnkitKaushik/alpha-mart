import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";
import { SEED_PRODUCTS } from "@/lib/data";

export function Featured() {
  return (
    <section className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-14">
      <Reveal className="mb-4 flex items-end justify-between border-b border-border pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Top products from verified suppliers</h2>
        <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          View all <ArrowRight className="size-4" />
        </Link>
      </Reveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEED_PRODUCTS.slice(0, 4).map((p, i) => (
          <Reveal key={p.id} delay={i * 0.07}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to p-10 text-center text-white sm:p-14">
          <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 animate-float rounded-full bg-brand/40 blur-3xl" aria-hidden />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Can&apos;t find it? Let suppliers find you.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/75">
            Post one requirement and receive quotes from matching suppliers.
          </p>
          <Button size="lg" className="relative mt-8 h-11 rounded-full px-8" nativeButton={false} render={<Link href="/requirement" />}>
            Post a requirement
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
