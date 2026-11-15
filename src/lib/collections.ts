import { discountPct, type Deal } from "@/lib/shop-data";

export interface Collection {
  title: string;
  intro: string;
  match: (d: Deal) => boolean;
}

export const COLLECTIONS: Record<string, Collection> = {
  all: {
    title: "Shop All Refurbished Devices",
    intro: "Every laptop, desktop and all-in-one we have in stock, quality-tested with a 6 month warranty.",
    match: () => true,
  },
  laptops: {
    title: "Buy Refurbished Laptops Online in India",
    intro: "Business-class laptops from Dell, HP, Lenovo and Apple, tested on 40 points and backed by a 6 month warranty. Up to 70% less than new.",
    match: (d) => d.kind === "laptop",
  },
  desktops: {
    title: "Refurbished Desktops",
    intro: "Reliable office and study towers with fresh Windows installs, ready to plug in and work.",
    match: (d) => d.kind === "desktop",
  },
  "all-in-one-pcs": {
    title: "Refurbished All-in-One PCs",
    intro: "Screen and computer in one clean setup. Ideal for front desks, homes and studios.",
    match: (d) => d.kind === "aio",
  },
  macbooks: {
    title: "Refurbished MacBooks",
    intro: "Apple MacBooks graded and tested, with battery health checked before listing.",
    match: (d) => d.name.includes("MacBook"),
  },
  "gaming-laptops": {
    title: "Refurbished Gaming Laptops",
    intro: "Dedicated graphics and high refresh screens for play and creative work.",
    match: (d) => d.tag === "GAMING",
  },
  "best-deals": {
    title: "Best Deals",
    intro: "Our deepest discounts right now. Grab them before they go.",
    match: (d) => discountPct(d) >= 65,
  },
};

export const typeOf = (d: Deal) => (d.name.includes("MacBook") ? "MacBooks" : d.kind === "laptop" ? "Laptops" : d.kind === "desktop" ? "Desktops" : "All-in-One PCs");
export const brandOf = (d: Deal) => d.name.split(" ")[0];
export const processorOf = (d: Deal) => {
  const s = d.spec[0];
  return s.includes("Apple") ? "Apple M-series" : s.includes("Ryzen") ? "AMD Ryzen" : /i(\d)/.test(s) ? `Intel Core i${s.match(/i(\d)/)?.[1]}` : "Other";
};

export const PRICE_BANDS = [
  { label: "Under ₹10,000", min: 0, max: 9999 },
  { label: "₹10,000 – ₹20,000", min: 10000, max: 19999 },
  { label: "₹20,000 – ₹30,000", min: 20000, max: 29999 },
  { label: "Above ₹30,000", min: 30000, max: Infinity },
];
