import type { Product } from "@/lib/data";
import { offeredOptions, specValues, type Deal, type ProductType } from "@/lib/site-content";

export { discountPct, type Deal } from "@/lib/site-content";

export const BUDGETS: { label: string; limit: string; href: string; blurb: string; image: string }[] = [
  { label: "Under", limit: "₹9,999", href: "/collections/all?max=9999", blurb: "School, browsing and everyday tasks", image: "/shop/desktop-pc-0.jpg" },
  { label: "Under", limit: "₹19,999", href: "/collections/all?max=19999", blurb: "Study laptops with all-day battery", image: "/shop/thinkpad-1.jpg" },
  { label: "Under", limit: "₹24,999", href: "/collections/all?max=24999", blurb: "Smooth office work and multitasking", image: "/shop/dell-latitude-0.jpg" },
  { label: "Above", limit: "₹30,000", href: "/collections/all?min=30000", blurb: "MacBooks and premium performance", image: "/shop/macbook-1.jpg" },
];

// Lets the existing enquiry dialog and WhatsApp button work with shop items.
export const dealToProduct = (d: Deal, t: ProductType | undefined): Product => ({
  id: d.id,
  name: d.name,
  category: "electronics",
  priceMin: d.price,
  priceMax: d.price,
  unit: "piece",
  moq: "1 piece",
  description: specValues(t, d).join(", "),
  image: "",
  supplier: { id: "alpha-mart", name: "Alpha Mart", city: "Delhi", verified: true, rating: 4.8, years: 5 },
});

// Each step up an option list (8 GB → 16 GB) adds that group's step to the base price.
export const configPrice = (d: Deal, groups: ReturnType<typeof offeredOptions>, picks: number[]) =>
  groups.reduce((sum, g, i) => sum + (picks[i] ?? 0) * g.step, d.price);
