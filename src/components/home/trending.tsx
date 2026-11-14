import { CategoryTile } from "@/components/site/category-tile";
import { Reveal } from "@/components/site/reveal";
import type { CategoryId } from "@/lib/data";

const TRENDING: { label: string; category: CategoryId }[] = [
  { label: "CNC machine", category: "machinery" },
  { label: "Turmeric", category: "food" },
  { label: "Cotton t-shirt", category: "apparel" },
  { label: "Basmati rice", category: "food" },
  { label: "TMT bars", category: "building" },
  { label: "Caustic soda", category: "chemicals" },
  { label: "Corrugated box", category: "packaging" },
  { label: "N95 mask", category: "medical" },
  { label: "Solar inverter", category: "electronics" },
  { label: "Hydraulic press", category: "machinery" },
  { label: "Silk saree", category: "apparel" },
  { label: "Red chilli", category: "food" },
];

export function Trending() {
  return (
    <section className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-8 pb-14">
      <h2 className="mb-4 text-xl font-semibold text-white">Trending on Alpha Mart</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TRENDING.map((t, i) => (
          <Reveal key={t.label} delay={(i % 6) * 0.05}>
            <CategoryTile {...t} variant="compact" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
