import type { Product } from "@/lib/data";

export type ShopImageKey =
  | "laptop"
  | "desktop-pc"
  | "all-in-one-pc"
  | "macbook"
  | "gaming-laptop"
  | "thinkpad"
  | "dell-latitude"
  | "hp-elitebook";

export interface Deal {
  id: string;
  kind: "laptop" | "desktop" | "aio";
  tag: string;
  name: string;
  spec: string[];
  rating: number;
  reviews: number;
  price: number;
  mrp: number;
  ram: string[];
  ssd: string[];
  image: ShopImageKey;
}

// Demo catalogue: model names are real product lines, prices and ratings are placeholders.
export const DEALS: Deal[] = [
  { id: "hp-240-g8", kind: "laptop", tag: "OFFICE USE", name: "HP Notebook 240 G8 | Core i3 | 14\" HD", spec: ["11th Gen i3", "14\" HD", "Windows 11"], rating: 4.6, reviews: 312, price: 24999, mrp: 61990, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "hp-elitebook" },
  { id: "dell-latitude-7410", kind: "laptop", tag: "CODING", name: "Dell Latitude 7410 | Core i7 | 14\" FHD", spec: ["10th Gen i7", "14\" FHD", "Windows 11"], rating: 4.7, reviews: 248, price: 39999, mrp: 129990, ram: ["16 GB", "32 GB"], ssd: ["512 GB", "1 TB"], image: "dell-latitude" },
  { id: "dell-latitude-7420", kind: "laptop", tag: "CODING", name: "Dell Latitude 7420 | Core i7 | 14\" FHD", spec: ["11th Gen i7", "14\" FHD", "Windows 11"], rating: 4.5, reviews: 190, price: 45999, mrp: 139990, ram: ["16 GB"], ssd: ["512 GB"], image: "dell-latitude" },
  { id: "thinkpad-t480", kind: "laptop", tag: "STUDENT", name: "Lenovo ThinkPad T480 | Core i5 | 14\" HD", spec: ["8th Gen i5", "14\" HD", "Windows 10"], rating: 4.4, reviews: 421, price: 17999, mrp: 54990, ram: ["8 GB", "16 GB"], ssd: ["256 GB"], image: "thinkpad" },
  { id: "elitebook-840-g6", kind: "laptop", tag: "OFFICE USE", name: "HP EliteBook 840 G6 | Core i5 | 14\" FHD", spec: ["8th Gen i5", "14\" FHD", "Windows 11"], rating: 4.6, reviews: 276, price: 21999, mrp: 79990, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "hp-elitebook" },
  { id: "macbook-air-m1", kind: "laptop", tag: "CREATIVE", name: "Apple MacBook Air M1 | 13.3\" Retina", spec: ["Apple M1", "13.3\" Retina", "macOS"], rating: 4.8, reviews: 534, price: 52999, mrp: 99900, ram: ["8 GB"], ssd: ["256 GB", "512 GB"], image: "macbook" },
  { id: "rog-strix-g15", kind: "laptop", tag: "GAMING", name: "ASUS ROG Strix G15 | Ryzen 7 | RTX 3060", spec: ["Ryzen 7", "15.6\" 144Hz", "Windows 11"], rating: 4.7, reviews: 143, price: 64999, mrp: 129990, ram: ["16 GB"], ssd: ["512 GB", "1 TB"], image: "gaming-laptop" },
  { id: "precision-3540", kind: "laptop", tag: "WORKSTATION", name: "Dell Precision 3540 | Core i7 | 15.6\" FHD", spec: ["8th Gen i7", "15.6\" FHD", "Windows 11"], rating: 4.5, reviews: 98, price: 34999, mrp: 119990, ram: ["16 GB", "32 GB"], ssd: ["512 GB"], image: "laptop" },
  { id: "lenovo-thinkcentre-m720", kind: "desktop", tag: "STUDENT", name: "Lenovo ThinkCentre M720 | Core i5 | Mini Tower", spec: ["9th Gen i5", "Mini tower", "Windows 11"], rating: 4.5, reviews: 164, price: 9499, mrp: 39990, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "desktop-pc" },
  { id: "dell-optiplex-7060", kind: "desktop", tag: "OFFICE USE", name: "Dell OptiPlex 7060 | Core i5 | Tower", spec: ["8th Gen i5", "Tower", "Windows 11"], rating: 4.6, reviews: 233, price: 13999, mrp: 45990, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "desktop-pc" },
  { id: "hp-elitedesk-800-g4", kind: "desktop", tag: "WORKSTATION", name: "HP EliteDesk 800 G4 | Core i7 | Tower", spec: ["8th Gen i7", "Tower", "Windows 11"], rating: 4.6, reviews: 118, price: 18999, mrp: 59990, ram: ["16 GB", "32 GB"], ssd: ["512 GB", "1 TB"], image: "desktop-pc" },
  { id: "hp-eliteone-800-g3", kind: "aio", tag: "OFFICE USE", name: "HP EliteOne 800 G3 | Core i5 | 23.8\" FHD All-in-One", spec: ["7th Gen i5", "23.8\" FHD", "Windows 10"], rating: 4.4, reviews: 87, price: 21999, mrp: 69990, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "all-in-one-pc" },
  { id: "apple-imac-21", kind: "aio", tag: "CREATIVE", name: "Apple iMac 21.5\" | Core i5 | Retina 4K", spec: ["Core i5", "21.5\" Retina 4K", "macOS"], rating: 4.7, reviews: 142, price: 32999, mrp: 99900, ram: ["8 GB", "16 GB"], ssd: ["256 GB", "512 GB"], image: "all-in-one-pc" },
];

export const SHOP_CATEGORIES: { label: string; slug: string; image: ShopImageKey; index?: number; fit?: "contain" | "cover" }[] = [
  { label: "Laptops", slug: "laptops", image: "laptop" },
  { label: "Desktops", slug: "desktops", image: "desktop-pc" },
  { label: "Gaming Laptops", slug: "gaming-laptops", image: "gaming-laptop" },
  { label: "All-in-One PCs", slug: "all-in-one-pcs", image: "all-in-one-pc", fit: "cover" },
  { label: "MacBooks", slug: "macbooks", image: "macbook", index: 1, fit: "cover" },
  { label: "Best Deals", slug: "best-deals", image: "hp-elitebook", fit: "cover" },
];

export const BUDGETS: { label: string; limit: string; href: string; blurb: string; image: ShopImageKey; index: number }[] = [
  { label: "Under", limit: "₹9,999", href: "/collections/all?max=9999", blurb: "School, browsing and everyday tasks", image: "desktop-pc", index: 0 },
  { label: "Under", limit: "₹19,999", href: "/collections/all?max=19999", blurb: "Study laptops with all-day battery", image: "thinkpad", index: 1 },
  { label: "Under", limit: "₹24,999", href: "/collections/all?max=24999", blurb: "Smooth office work and multitasking", image: "dell-latitude", index: 0 },
  { label: "Above", limit: "₹30,000", href: "/collections/all?min=30000", blurb: "MacBooks and premium performance", image: "macbook", index: 1 },
];

export const discountPct = (d: Pick<Deal, "price" | "mrp">) => Math.round((1 - d.price / d.mrp) * 100);

// Lets the existing enquiry dialog and WhatsApp button work with shop items.
export const dealToProduct = (d: Deal): Product => ({
  id: d.id,
  name: d.name,
  category: "electronics",
  priceMin: d.price,
  priceMax: d.price,
  unit: "piece",
  moq: "1 piece",
  description: d.spec.join(", "),
  image: "",
  supplier: { id: "alpha-mart", name: "Alpha Mart", city: "Delhi", verified: true, rating: 4.8, years: 5 },
});

// Demo pricing: each step up in RAM or storage adds a flat amount to the base price.
export const RAM_STEP = 2000;
export const SSD_STEP = 1500;
export const configPrice = (d: Deal, ramIdx: number, ssdIdx: number) => d.price + ramIdx * RAM_STEP + ssdIdx * SSD_STEP;
