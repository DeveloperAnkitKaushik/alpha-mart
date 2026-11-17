import { z } from "zod";
import { SHOP_IMAGES, type ShopImageKey } from "@/lib/shop-images";

// A site path ("/shop/x.jpg", "/api/img/<id>" for uploads) or an https link.
export const imageSrc = z
  .string()
  .trim()
  .regex(/^(\/(?!\/)\S+|https:\/\/\S+)$/, "Use an https:// link or upload an image");

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slug = z.string().max(60).regex(SLUG_RE);
const text = (max: number) => z.string().trim().max(max);
// Not trimmed: products key their specs and options by these names, so a stray space must be fixed, not silently changed.
const label = (max: number, empty: string) =>
  z.string().max(max).min(1, empty).refine((s) => s === s.trim() && s.length > 0, "Remove spaces at the start or end");

export const bannerSchema = z.object({
  id: z.string().min(1).max(60),
  desktop: imageSrc,
  mobile: imageSrc.or(z.literal("")),
  href: z.string().trim().max(300).regex(/^(\/(?!\/)|#|https:\/\/)/, "Start with /, # or https://"),
  alt: text(120).min(1, "Describe the banner for screen readers"),
  enabled: z.boolean(),
});

export const SALE_LAYOUTS = ["spotlight", "compact", "products"] as const;
export const saleSchema = z.object({
  enabled: z.boolean(),
  layout: z.enum(SALE_LAYOUTS),
  eyebrow: text(40),
  title: text(60).min(1, "Give the sale a title"),
  discount: text(20),
  code: text(20).regex(/^[A-Z0-9]*$/, "Capital letters and numbers only"),
  // YYYY-MM-DD, sale ends at the start of that day. Empty means end of the current month.
  endsAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

export const STAT_ICONS = ["smile", "map", "leaf", "star", "users", "truck"] as const;
export const statSchema = z.object({
  icon: z.enum(STAT_ICONS),
  value: z.number().min(0).max(1e9),
  decimals: z.number().int().min(0).max(2),
  // Not trimmed: " t" and " / 5" need their leading space.
  suffix: z.string().max(10),
  label: text(40).min(1, "Add a label"),
});

export const categorySchema = z.object({
  slug,
  label: text(40).min(1, "Add a name"),
  title: text(120),
  intro: text(400),
  image: imageSrc.or(z.literal("")),
  fit: z.enum(["contain", "cover"]),
});

// A product type (Laptop, Desktop…) decides which spec fields and option groups its products have.
export const optionGroupSchema = z.object({
  name: label(30, "Name every option group"),
  // Added to the base price for each step up the list, e.g. 8 GB → 16 GB.
  step: z.number().int().min(0).max(1_000_000),
  values: z.array(text(30).min(1, "Option values can't be empty")).min(1, "Add at least one value").max(12),
});
export const productTypeSchema = z.object({
  id: slug,
  name: text(40).min(1, "Name the type"),
  specs: z.array(label(40, "Name every spec field")).max(12),
  options: z.array(optionGroupSchema).max(6),
});

export const productSchema = z
  .object({
    id: slug,
    type: slug,
    tag: text(24).min(1, "Add a tag").transform((s) => s.toUpperCase()),
    name: text(140).min(3, "Name is too short"),
    // Keyed by the type's spec field and option group names.
    specs: z.record(z.string(), text(80)),
    options: z.record(z.string(), z.array(text(30))),
    rating: z.number().min(0).max(5),
    reviews: z.number().int().min(0),
    price: z.number().int().positive("Enter a price"),
    mrp: z.number().int().positive("Enter the MRP"),
    images: z.array(imageSrc).max(8),
    categories: z.array(slug).max(20),
    onSale: z.boolean(),
  })
  .refine((d) => d.price <= d.mrp, { path: ["price"], message: "Price can't be above MRP" });

export const siteContentSchema = z
  .object({
    banners: z.array(bannerSchema).max(10),
    sale: saleSchema,
    stats: z.array(statSchema).max(4),
    categories: z.array(categorySchema).max(24),
    types: z.array(productTypeSchema).min(1, "Keep at least one product type").max(20),
    products: z.array(productSchema).max(300),
  })
  .superRefine((c, ctx) => {
    const dup = (ids: string[], path: string, what: string) =>
      ids.forEach((id, i) => {
        if (ids.indexOf(id) !== i) ctx.addIssue({ code: "custom", path: [path, i], message: `Duplicate ${what} "${id}"` });
      });
    dup(c.categories.map((x) => x.slug), "categories", "category");
    dup(c.products.map((x) => x.id), "products", "product");
    dup(c.banners.map((x) => x.id), "banners", "banner");
    dup(c.types.map((x) => x.id), "types", "type");
    c.types.forEach((t, i) => {
      const names = [...t.specs, ...t.options.map((g) => g.name)];
      names.forEach((n, j) => {
        if (names.indexOf(n) !== j) ctx.addIssue({ code: "custom", path: ["types", i], message: `"${n}" is used twice` });
      });
      t.options.forEach((g) => {
        if (new Set(g.values).size !== g.values.length) ctx.addIssue({ code: "custom", path: ["types", i], message: `${g.name} has a value twice` });
      });
    });
    c.products.forEach((p, i) => {
      const t = c.types.find((x) => x.id === p.type);
      if (!t) return ctx.addIssue({ code: "custom", path: ["products", i], message: "Pick a product type" });
      for (const g of t.options) {
        const picked = p.options[g.name] ?? [];
        if (!picked.length) ctx.addIssue({ code: "custom", path: ["products", i], message: `Pick at least one ${g.name} option` });
        else if (picked.some((v) => !g.values.includes(v))) ctx.addIssue({ code: "custom", path: ["products", i], message: `${g.name} has a value the type no longer offers` });
      }
      const top = offeredOptions(t, p).reduce((sum, g) => sum + (g.values.length - 1) * g.step, p.price);
      if (top > p.mrp) ctx.addIssue({ code: "custom", path: ["products", i], message: `Its top configuration costs ₹${top.toLocaleString("en-IN")}, above the MRP. Raise the MRP or lower the price.` });
    });
    c.categories.forEach((x, i) => {
      if (x.slug === ALL_COLLECTION.slug) ctx.addIssue({ code: "custom", path: ["categories", i], message: `"${x.slug}" is reserved` });
    });
  });

export type Banner = z.infer<typeof bannerSchema>;
export type Sale = z.infer<typeof saleSchema>;
export type Stat = z.infer<typeof statSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ProductType = z.infer<typeof productTypeSchema>;
export type OptionGroup = z.infer<typeof optionGroupSchema>;
export type Deal = z.output<typeof productSchema>;
export type SiteContent = z.output<typeof siteContentSchema>;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Appends -2, -3… so a new slug never collides with an existing one.
export function uniqueSlug(base: string, taken: string[], fallback: string) {
  const root = slugify(base) || fallback;
  let s = root;
  for (let n = 2; taken.includes(s); n++) s = `${root}-${n}`;
  return s;
}

export const findType = (types: ProductType[], d: Pick<Deal, "type">) => types.find((t) => t.id === d.type);

// Spec values in the type's field order, skipping blanks.
export const specValues = (t: ProductType | undefined, d: Deal) => (t?.specs ?? Object.keys(d.specs)).map((l) => d.specs[l]?.trim()).filter((v): v is string => Boolean(v));

// The option groups this product offers, in the type's order. Index 0 is the cheapest offered value
// (the base price); each index above it adds one step.
export const offeredOptions = (t: ProductType | undefined, d: Deal) =>
  (t?.options ?? [])
    .map((g) => ({ name: g.name, step: g.step, values: g.values.filter((v) => d.options[g.name]?.includes(v)) }))
    .filter((g) => g.values.length > 0);

export const discountPct = (d: Pick<Deal, "price" | "mrp">) => Math.max(0, Math.round((1 - d.price / d.mrp) * 100));

// Demo catalogue: model names are real product lines, prices and ratings are placeholders.
type Kind = "laptop" | "desktop" | "aio";
type Seed = Omit<Deal, "images" | "categories" | "onSale" | "type" | "specs" | "options"> & { kind: Kind; spec: string[]; ram: string[]; ssd: string[]; image: ShopImageKey };
const SEED: Seed[] = [
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

// The rules the hardcoded collections used, applied once to seed each product's categories.
const SEED_MATCH: Record<string, (d: Omit<Seed, "image">) => boolean> = {
  laptops: (d) => d.kind === "laptop",
  desktops: (d) => d.kind === "desktop",
  "gaming-laptops": (d) => d.tag === "GAMING",
  "all-in-one-pcs": (d) => d.kind === "aio",
  macbooks: (d) => d.name.includes("MacBook"),
  "best-deals": (d) => discountPct(d) >= 65,
};

const photo = (k: ShopImageKey, i = 0) => SHOP_IMAGES[k]?.[i] ?? "";

const SEED_OPTIONS = [
  { name: "RAM", step: 2000, values: ["8 GB", "16 GB", "32 GB"] },
  { name: "Storage", step: 1500, values: ["256 GB", "512 GB", "1 TB"] },
];
const SEED_TYPES: ProductType[] = [
  { id: "laptop", name: "Laptop", specs: ["Processor", "Screen", "Operating system"], options: SEED_OPTIONS },
  { id: "desktop", name: "Desktop", specs: ["Processor", "Form factor", "Operating system"], options: SEED_OPTIONS },
  { id: "aio", name: "All-in-One", specs: ["Processor", "Screen", "Operating system"], options: SEED_OPTIONS },
];

export const DEFAULT_CONTENT: SiteContent = {
  banners: [1, 2, 3].map((n) => ({
    id: `banner-${n}`,
    desktop: `/posters/banner-${n}-desktop.jpg`,
    mobile: `/posters/banner-${n}-mobile.jpg`,
    href: "#deals",
    alt: `Sale banner ${n}`,
    enabled: true,
  })),
  sale: { enabled: true, layout: "spotlight", eyebrow: "✦ REFURB FEST ✦", title: "Mega Refurb Sale", discount: "70% OFF", code: "ALPHA500", endsAt: "" },
  stats: [
    { icon: "smile", value: 12500, decimals: 0, suffix: "+", label: "Devices supplied" },
    { icon: "map", value: 800, decimals: 0, suffix: "+", label: "Pincodes served" },
    { icon: "leaf", value: 140, decimals: 0, suffix: " t", label: "CO₂ saved" },
    { icon: "star", value: 4.7, decimals: 1, suffix: " / 5", label: "Customer rating" },
  ],
  categories: [
    { slug: "laptops", label: "Laptops", title: "Buy Refurbished Laptops Online in India", intro: "Business-class laptops from Dell, HP, Lenovo and Apple, tested on 40 points and backed by a 6 month warranty. Up to 70% less than new.", image: photo("laptop"), fit: "contain" },
    { slug: "desktops", label: "Desktops", title: "Refurbished Desktops", intro: "Reliable office and study towers with fresh Windows installs, ready to plug in and work.", image: photo("desktop-pc"), fit: "contain" },
    { slug: "gaming-laptops", label: "Gaming Laptops", title: "Refurbished Gaming Laptops", intro: "Dedicated graphics and high refresh screens for play and creative work.", image: photo("gaming-laptop"), fit: "contain" },
    { slug: "all-in-one-pcs", label: "All-in-One PCs", title: "Refurbished All-in-One PCs", intro: "Screen and computer in one clean setup. Ideal for front desks, homes and studios.", image: photo("all-in-one-pc"), fit: "cover" },
    { slug: "macbooks", label: "MacBooks", title: "Refurbished MacBooks", intro: "Apple MacBooks graded and tested, with battery health checked before listing.", image: photo("macbook", 1), fit: "cover" },
    { slug: "best-deals", label: "Best Deals", title: "Best Deals", intro: "Our deepest discounts right now. Grab them before they go.", image: photo("hp-elitebook"), fit: "cover" },
  ],
  types: SEED_TYPES,
  products: SEED.map(({ image, kind, spec, ram, ssd, ...d }, i) => ({
    ...d,
    type: kind,
    specs: Object.fromEntries(SEED_TYPES.find((t) => t.id === kind)!.specs.map((label, j) => [label, spec[j] ?? ""])),
    options: { RAM: ram, Storage: ssd },
    images: SHOP_IMAGES[image] ?? [],
    categories: Object.keys(SEED_MATCH).filter((slug) => SEED_MATCH[slug]({ ...d, kind, spec, ram, ssd })),
    onSale: i < 5,
  })),
};

export const ALL_COLLECTION = {
  slug: "all",
  label: "All devices",
  title: "Shop All Refurbished Devices",
  intro: "Every laptop, desktop and all-in-one we have in stock, quality-tested with a 6 month warranty.",
};
