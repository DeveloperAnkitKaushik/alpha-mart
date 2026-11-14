"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { CategoryTile } from "@/components/site/category-tile";
import { ProductGrid } from "@/components/site/product-grid";
import { getProducts } from "@/lib/api";
import { resolveSlug, SUBCATEGORIES, slugify } from "@/lib/data";
import { selectClass } from "@/components/site/field";
import { cn } from "@/lib/utils";

type Sort = "relevance" | "price-asc" | "price-desc";

export function CategoryView({ slug }: { slug: string }) {
  const info = resolveSlug(slug);
  const { data, isPending } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");

  const inScope = useMemo(
    () =>
      (data ?? []).filter((p) =>
        info?.sub ? p.subcategory === info.sub.slug : p.category === info?.category.id,
      ),
    [data, info],
  );
  const cities = useMemo(() => [...new Set(inScope.map((p) => p.supplier.city))].sort(), [inScope]);
  const results = useMemo(() => {
    const list = city ? inScope.filter((p) => p.supplier.city === city) : inScope;
    if (sort === "relevance") return list;
    return [...list].sort((a, b) => (sort === "price-asc" ? a.priceMin - b.priceMin : b.priceMin - a.priceMin));
  }, [inScope, city, sort]);

  if (!info) {
    return (
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-semibold">Category not found</h1>
        <Link href="/" className="mt-4 inline-block text-brand hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const { category, sub } = info;
  const title = sub?.label ?? category.label;
  const related = SUBCATEGORIES[category.id].filter((l) => slugify(l) !== sub?.slug);

  return (
    <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        {sub ? (
          <Link href={`/category/${category.id}`} className="hover:text-foreground">{category.label}</Link>
        ) : (
          <span className="text-foreground">{category.label}</span>
        )}
        {sub && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{sub.label}</span>
          </>
        )}
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        {isPending ? "Loading…" : `${results.length} products from verified suppliers`}
      </p>

      <section aria-label="Related categories" className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {sub ? `More in ${category.label}` : "Shop by type"}
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {related.slice(0, 6).map((label) => (
            <CategoryTile key={label} label={label} category={category.id} />
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city" className={cn(selectClass, "w-44")}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className={cn(selectClass, "w-48")}>
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-6">
        <ProductGrid key={`${slug}-${city}-${sort}`} products={results} loading={isPending} />
      </div>
    </div>
  );
}
