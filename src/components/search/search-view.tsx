"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/site/product-grid";
import { getProducts } from "@/lib/api";
import { CATEGORIES } from "@/lib/data";

export function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category") ?? "";
  const city = params.get("city") ?? "";

  const { data, isPending } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const results = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          (!category || p.category === category) &&
          (!city || p.supplier.city === city) &&
          (!q || `${p.name} ${p.description} ${p.supplier.name} ${p.supplier.city}`.toLowerCase().includes(q)),
      ),
    [data, q, category, city],
  );

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("category", id);
    else next.delete("category");
    router.replace(`/search?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">
        {q ? `Results for “${params.get("q")}”` : "All products"}
        {city && <span className="text-muted-foreground"> in {city}</span>}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
        {isPending ? "Loading…" : `${results.length} products found`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[{ id: "", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              category === c.id
                ? "border-brand bg-brand text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-brand/60 hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <ProductGrid key={`${q}-${category}-${city}`} products={results} loading={isPending} />
      </div>
    </div>
  );
}
