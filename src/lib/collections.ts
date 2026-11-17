import { ALL_COLLECTION, type Deal, type SiteContent } from "@/lib/site-content";

// "all" is built in; every other collection is an admin-managed category.
export function findCollection({ categories, products }: SiteContent, slug: string) {
  if (slug === ALL_COLLECTION.slug) return { title: ALL_COLLECTION.title, intro: ALL_COLLECTION.intro, deals: products };
  const c = categories.find((x) => x.slug === slug);
  return c ? { title: c.title || c.label, intro: c.intro, deals: products.filter((d) => d.categories.includes(slug)) } : null;
}

export const brandOf = (d: Deal) => d.name.split(" ")[0];
export const processorOf = (d: Deal) => {
  const s = d.specs.Processor ?? "";
  return s.includes("Apple") ? "Apple M-series" : s.includes("Ryzen") ? "AMD Ryzen" : /i(\d)/.test(s) ? `Intel Core i${s.match(/i(\d)/)?.[1]}` : "Other";
};

export const PRICE_BANDS = [
  { label: "Under ₹10,000", min: 0, max: 9999 },
  { label: "₹10,000 – ₹20,000", min: 10000, max: 19999 },
  { label: "₹20,000 – ₹30,000", min: 20000, max: 29999 },
  { label: "Above ₹30,000", min: 30000, max: Infinity },
];
