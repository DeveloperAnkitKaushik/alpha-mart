"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, PackageSearch, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { DealCard } from "@/components/shop/deals";
import { FilterGroup } from "@/components/shop/collection/filter-group";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { brandOf, findCollection, PRICE_BANDS, processorOf } from "@/lib/collections";
import { findType, type ProductType } from "@/lib/site-content";
import { discountPct, type Deal } from "@/lib/shop-data";
import { useSiteContent } from "@/components/site/site-content";
import { formatPrice } from "@/lib/data";

const PERKS = ["Free 6 Month Warranty", "40-Point Quality Check", "15 Day Replacement", "Pan-India Delivery", "GST Invoice", "Video Call Before You Buy", "Like-New Condition"];

const SORTS: Record<string, (a: Deal, b: Deal) => number> = {
  "Best selling": (a, b) => b.reviews - a.reviews,
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Biggest discount": (a, b) => discountPct(b) - discountPct(a),
  "Top rated": (a, b) => b.rating - a.rating,
};

const makeFacets = (types: ProductType[]) => [
  { key: "type", title: "Product type", of: (d: Deal) => findType(types, d)?.name ?? "Other" },
  { key: "use", title: "Find by usage", of: (d: Deal) => d.tag.charAt(0) + d.tag.slice(1).toLowerCase() },
  { key: "brand", title: "Brand", of: brandOf },
  { key: "processor", title: "Processor", of: processorOf },
  { key: "price", title: "Price", of: (d: Deal) => PRICE_BANDS.find((b) => d.price >= b.min && d.price <= b.max)?.label ?? "" },
] as const;
type FacetKey = ReturnType<typeof makeFacets>[number]["key"];

const count = (deals: Deal[], of: (d: Deal) => string) =>
  Object.entries(deals.reduce<Record<string, number>>((m, d) => ({ ...m, [of(d)]: (m[of(d)] ?? 0) + 1 }), {})).map(([value, c]) => ({ value, count: c }));

const num = (v: string | null, fallback: number) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

// Remount on query change so header search and brand links (same route, new ?q / ?brand) reset the filters.
export function CollectionView({ slug }: { slug: string }) {
  const params = useSearchParams();
  return <CollectionResults key={params.toString()} slug={slug} params={params} />;
}

function CollectionResults({ slug, params }: { slug: string; params: URLSearchParams }) {
  const content = useSiteContent();
  const facets = useMemo(() => makeFacets(content.types), [content.types]);
  const collection = useMemo(() => findCollection(content, slug), [content, slug]);
  const [sort, setSort] = useState("Best selling");
  const [picked, setPicked] = useState<Record<FacetKey, string[]>>(() => ({ type: [], use: [], brand: params.getAll("brand"), processor: [], price: [] }));
  const [cap, setCap] = useState({ min: num(params.get("min"), 0), max: num(params.get("max"), Infinity) });
  const [showFilters, setShowFilters] = useState(false);
  const [term, setTerm] = useState(params.get("q")?.trim() ?? "");

  const base = useMemo(() => collection?.deals ?? [], [collection]);
  const results = useMemo(
    () =>
      base
        .filter((d) => !term || `${d.name} ${Object.values(d.specs).join(" ")} ${d.tag}`.toLowerCase().includes(term.toLowerCase()))
        .filter((d) => d.price >= cap.min && d.price <= cap.max)
        .filter((d) => facets.every((f) => picked[f.key].length === 0 || picked[f.key].includes(f.of(d))))
        .sort(SORTS[sort]),
    [base, term, cap, picked, sort, facets],
  );

  if (!collection) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-bold text-navy">Collection not found</h1>
        <Link href="/collections/all" className="mt-3 inline-block text-ember hover:underline">See all devices</Link>
      </div>
    );
  }

  const toggle = (key: FacetKey, value: string) =>
    setPicked((p) => ({ ...p, [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value] }));
  const capLabel = cap.max !== Infinity ? `Under ${formatPrice(cap.max + 1)}` : cap.min > 0 ? `Above ${formatPrice(cap.min)}` : null;
  const chips = facets.flatMap((f) => picked[f.key].map((v) => ({ key: f.key, v })));
  const clearAll = () => {
    setPicked({ type: [], use: [], brand: [], processor: [], price: [] });
    setCap({ min: 0, max: Infinity });
    setTerm("");
  };

  return (
    <div className="bg-cream pb-16">
      <div className="overflow-hidden border-y border-peach bg-white py-3" aria-hidden>
        <ul className="flex w-max animate-marquee gap-10 text-sm font-bold text-navy">
          {[...PERKS, ...PERKS].map((p, i) => (
            <li key={i} className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="size-4 text-ember" /> {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="container-x pt-5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-navy">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-foreground">{collection.title}</span>
        </nav>

        <header className="mx-auto mt-6 max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{collection.title}</h1>
          <Sparkles className="mx-auto my-2 size-5 text-ember" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">{collection.intro}</p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[16.5rem_1fr]">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-navy ring-1 ring-border lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> {showFilters ? "Hide" : "Show"} filters and sort
          </button>

          <aside className={`${showFilters ? "block" : "hidden"} self-start rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border lg:sticky lg:top-32 lg:block`}>
            <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase" htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-border bg-cream/50 px-3 text-sm font-semibold outline-none focus:border-navy"
            >
              {Object.keys(SORTS).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <div className="mt-5 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-navy">
                <SlidersHorizontal className="size-4" /> Filter by
              </p>
              {(chips.length > 0 || capLabel || term) && (
                <button type="button" onClick={clearAll} className="text-xs font-semibold text-ember hover:underline">Clear all</button>
              )}
            </div>
            {facets.map((f, i) => (
              <FilterGroup key={f.key} title={f.title} options={count(base, f.of)} selected={picked[f.key]} onToggle={(v) => toggle(f.key, v)} defaultOpen={i === 0} />
            ))}
          </aside>

          <section aria-label="Products" className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 text-sm font-semibold text-muted-foreground" aria-live="polite">{results.length} products</p>
              {term && (
                <button type="button" onClick={() => setTerm("")} className="flex items-center gap-1 rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white">
                  &ldquo;{term}&rdquo; <X className="size-3" />
                </button>
              )}
              {capLabel && (
                <button type="button" onClick={() => setCap({ min: 0, max: Infinity })} className="flex items-center gap-1 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
                  {capLabel} <X className="size-3" />
                </button>
              )}
              {chips.map((c) => (
                <button key={c.key + c.v} type="button" onClick={() => toggle(c.key, c.v)} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy ring-1 ring-border hover:ring-navy">
                  {c.v} <X className="size-3" />
                </button>
              ))}
            </div>

            {results.length === 0 ? (
              <StateCard
                icon={PackageSearch}
                className="mt-6"
                title="No devices match"
                body="Try removing a filter, or tell us what you need and we will source it for you."
              >
                <button type="button" onClick={clearAll} className={stateBtn.primary}>Clear all filters</button>
                <Link href="/requirement" className={stateBtn.ghost}>Send a requirement</Link>
              </StateCard>
            ) : (
              <motion.div layout className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {results.map((d) => (
                    <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }} className="grid">
                      <DealCard deal={d} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
