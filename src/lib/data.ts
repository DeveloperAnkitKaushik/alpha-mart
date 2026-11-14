import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  priceMin: z.number(),
  priceMax: z.number(),
  unit: z.string(),
  moq: z.string(),
  description: z.string(),
  image: z.string(),
  supplier: z.object({
    id: z.string(),
    name: z.string(),
    city: z.string(),
    verified: z.boolean(),
    rating: z.number(),
    years: z.number(),
  }),
});
export type Product = z.infer<typeof productSchema>;

export const leadSchema = z.object({
  productId: z.string().min(1),
  supplierId: z.string().min(1),
  name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  quantity: z.string().min(1, "Enter a quantity"),
  message: z.string().max(500).optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const requirementSchema = z.object({
  title: z.string().min(3, "Tell us what you need"),
  category: z.string().min(1, "Pick a category"),
  quantity: z.string().min(1, "Enter a quantity"),
  city: z.string().min(2, "Enter a city"),
  budget: z.string().optional(),
  details: z.string().max(1000).optional(),
  name: z.string().min(2, "Enter your name"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
});
export type RequirementInput = z.infer<typeof requirementSchema>;

export const CATEGORIES = [
  { id: "machinery", label: "Industrial Machinery", icon: "Cog", count: 48200 },
  { id: "electronics", label: "Electronics", icon: "Cpu", count: 31400 },
  { id: "apparel", label: "Apparel & Textiles", icon: "Shirt", count: 62900 },
  { id: "food", label: "Food & Agro", icon: "Wheat", count: 27800 },
  { id: "building", label: "Building Materials", icon: "Hammer", count: 39100 },
  { id: "chemicals", label: "Chemicals", icon: "FlaskConical", count: 18600 },
  { id: "packaging", label: "Packaging", icon: "Package", count: 22300 },
  { id: "medical", label: "Medical Supplies", icon: "Stethoscope", count: 14700 },
] as const;

const img = (category: string) => `/products/${category}.svg`;

const sup = (
  id: string,
  name: string,
  city: string,
  rating: number,
  years: number,
  verified = true,
) => ({ id, name, city, rating, years, verified });

const HAND_PRODUCTS: Product[] = [
  { id: "cnc-vmc-850", name: "CNC Vertical Machining Center VMC 850", category: "machinery", priceMin: 1450000, priceMax: 1850000, unit: "piece", moq: "1 piece", description: "3-axis VMC with 24-tool ATC, BT40 spindle, Fanuc controller. 2-year warranty and on-site installation.", image: img("machinery"), supplier: sup("s1", "Rajkot Precision Tools", "Rajkot", 4.7, 14) },
  { id: "cotton-tshirt", name: "Combed Cotton Round-Neck T-Shirt", category: "apparel", priceMin: 95, priceMax: 140, unit: "piece", moq: "100 pieces", description: "180 GSM combed cotton, pre-shrunk, available in 24 colours. Custom print and private label.", image: img("apparel"), supplier: sup("s3", "Tiruppur Knit Works", "Tiruppur", 4.8, 18) },
  { id: "basmati-1121", name: "1121 Extra-Long Basmati Rice", category: "food", priceMin: 78, priceMax: 96, unit: "kg", moq: "1 tonne", description: "Aged 2 years, 8.3mm average grain length. Export-grade packing in 5/10/25 kg bags.", image: img("food"), supplier: sup("s4", "Karnal Agro Exports", "Karnal", 4.6, 22) },
  { id: "tmt-fe500d", name: "TMT Bar Fe-500D (12mm)", category: "building", priceMin: 56000, priceMax: 62000, unit: "tonne", moq: "5 tonnes", description: "Earthquake-resistant Fe-500D bars, ISI marked, mill test certificate with every lot.", image: img("building"), supplier: sup("s5", "Bhilai Steel Traders", "Raipur", 4.4, 12) },
  { id: "caustic-soda", name: "Caustic Soda Flakes 99%", category: "chemicals", priceMin: 31, priceMax: 38, unit: "kg", moq: "1 tonne", description: "Industrial grade NaOH flakes, 25 kg HDPE bags, COA on request.", image: img("chemicals"), supplier: sup("s6", "Vapi Chemicals Pvt Ltd", "Vapi", 4.3, 16) },
  { id: "corrugated-box", name: "5-Ply Corrugated Shipping Boxes", category: "packaging", priceMin: 22, priceMax: 48, unit: "piece", moq: "500 pieces", description: "Custom size, 3-colour flexo print, 150 BF kraft liner. Free design support.", image: img("packaging"), supplier: sup("s7", "Pack India Industries", "Ahmedabad", 4.6, 11) },
  { id: "n95-mask", name: "N95 Respirator Mask (Box of 20)", category: "medical", priceMin: 480, priceMax: 640, unit: "box", moq: "20 boxes", description: "5-layer filtration, 95% BFE, adjustable nose clip. CE and ISO 13485 certified.", image: img("medical"), supplier: sup("s8", "MediCore Supplies", "Mumbai", 4.5, 8) },
  { id: "solar-inverter", name: "5kW Hybrid Solar Inverter", category: "electronics", priceMin: 62000, priceMax: 78000, unit: "piece", moq: "1 piece", description: "MPPT 80A, dual MPPT, WiFi monitoring, 5-year warranty. Pan-India service network.", image: img("electronics"), supplier: sup("s9", "SunGrid Energy", "Pune", 4.7, 7) },
  { id: "hydraulic-press", name: "100 Ton Hydraulic Press Machine", category: "machinery", priceMin: 520000, priceMax: 690000, unit: "piece", moq: "1 piece", description: "H-frame press with PLC control, 800mm stroke, safety light curtain. Custom tonnage available.", image: img("machinery"), supplier: sup("s10", "Ludhiana Heavy Engg", "Ludhiana", 4.5, 25) },
  { id: "silk-saree", name: "Banarasi Silk Saree (Wholesale Lot)", category: "apparel", priceMin: 1800, priceMax: 4200, unit: "piece", moq: "10 pieces", description: "Handloom Katan silk with zari border, 6.3m with blouse piece. GI-tagged.", image: img("apparel"), supplier: sup("s11", "Varanasi Weaves", "Varanasi", 4.9, 31) },
  { id: "red-chilli", name: "Guntur Red Chilli Powder", category: "food", priceMin: 190, priceMax: 240, unit: "kg", moq: "500 kg", description: "Sanam S4 variety, 40,000 SHU, steam-sterilised, FSSAI and spice board approved.", image: img("food"), supplier: sup("s12", "Guntur Spice Hub", "Guntur", 4.4, 13, false) },
];

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export const CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Ahmedabad", "Pune", "Hyderabad", "Jaipur", "Surat",
  "Rajkot", "Tiruppur", "Karnal", "Raipur", "Vapi", "Ludhiana", "Varanasi", "Guntur",
] as const;

export const SUBCATEGORIES: Record<(typeof CATEGORIES)[number]["id"], string[]> = {
  machinery: ["CNC machine", "Hydraulic press", "Lathe machine", "Industrial boiler", "Welding machine"],
  electronics: ["Solar inverter", "Power adapter", "CCTV camera", "Lithium battery", "Smart meter"],
  apparel: ["Cotton t-shirt", "Silk saree", "Uniform", "Denim jeans"],
  food: ["Basmati rice", "Red chilli", "Turmeric", "Cashew nuts", "Tea", "Edible oil"],
  building: ["TMT bars", "Ceramic tiles", "Paver blocks"],
  chemicals: ["Caustic soda", "Industrial solvent", "Pigment", "Fertilizer", "Adhesive", "Dye"],
  packaging: ["Corrugated box", "Paper bag", "Pouch", "Glass bottle", "Stretch film"],
  medical: ["N95 mask", "Surgical gloves", "Syringe", "Hospital bed", "BP monitor"],
};

export const slugify = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function resolveSlug(slug: string) {
  const category = CATEGORIES.find((c) => c.id === slug);
  if (category) return { category, sub: null };
  for (const c of CATEGORIES) {
    const label = SUBCATEGORIES[c.id].find((l) => slugify(l) === slug);
    if (label) return { category: c, sub: { slug, label } };
  }
  return null;
}

const HAND_SUBCATEGORY: Record<string, string> = {
  "cnc-vmc-850": "cnc-machine",
  "cotton-tshirt": "cotton-t-shirt",
  "basmati-1121": "basmati-rice",
  "tmt-fe500d": "tmt-bars",
  "caustic-soda": "caustic-soda",
  "corrugated-box": "corrugated-box",
  "n95-mask": "n95-mask",
  "solar-inverter": "solar-inverter",
  "hydraulic-press": "hydraulic-press",
  "silk-saree": "silk-saree",
  "red-chilli": "red-chilli",
};

const VARIANTS = ["Heavy Duty", "Premium", "Industrial Grade", "Export Quality", "Standard", "Custom"];
const SUPPLIER_POOL = [
  sup("g1", "Shree Balaji Traders", "Mumbai", 4.5, 12),
  sup("g2", "Om Sai Enterprises", "Delhi", 4.3, 8),
  sup("g3", "Namo Industries", "Ahmedabad", 4.6, 15),
  sup("g4", "Krishna Exports", "Surat", 4.4, 10),
  sup("g5", "Bharat Manufacturing Co", "Pune", 4.7, 21),
  sup("g6", "Sri Lakshmi Agencies", "Chennai", 4.2, 9, false),
  sup("g7", "Eastern Supplies", "Kolkata", 4.4, 14),
  sup("g8", "Deccan Industrial Works", "Hyderabad", 4.5, 11),
  sup("g9", "Pink City Traders", "Jaipur", 4.3, 7),
  sup("g10", "Southern Tech Solutions", "Bengaluru", 4.8, 17),
];
const PRICING: Record<CategoryId, { base: number; unit: string; moq: string }> = {
  machinery: { base: 150000, unit: "piece", moq: "1 piece" },
  electronics: { base: 2500, unit: "piece", moq: "10 pieces" },
  apparel: { base: 300, unit: "piece", moq: "50 pieces" },
  food: { base: 150, unit: "kg", moq: "100 kg" },
  building: { base: 5000, unit: "piece", moq: "100 pieces" },
  chemicals: { base: 400, unit: "kg", moq: "250 kg" },
  packaging: { base: 60, unit: "piece", moq: "500 pieces" },
  medical: { base: 800, unit: "piece", moq: "20 pieces" },
};

const generated: Product[] = CATEGORIES.flatMap((c) =>
  SUBCATEGORIES[c.id].flatMap((label, li) => {
    const slug = slugify(label);
    const { base, unit, moq } = PRICING[c.id];
    return VARIANTS.map((variant, i): Product => {
      const priceMin = Math.round(base * (0.55 + i * 0.17 + (li % 3) * 0.08));
      return {
        id: `${slug}-${i + 1}`,
        name: `${variant} ${label}`,
        category: c.id,
        subcategory: slug,
        priceMin,
        priceMax: Math.round(priceMin * 1.25),
        unit,
        moq,
        description: `${variant} ${label.toLowerCase()} made to quality standards. Bulk orders welcome, pan-India delivery and GST invoice.`,
        image: img(c.id),
        supplier: SUPPLIER_POOL[(li * 3 + i) % SUPPLIER_POOL.length],
      };
    });
  }),
);

export const SEED_PRODUCTS: Product[] = [
  ...HAND_PRODUCTS.map((p) => ({ ...p, subcategory: HAND_SUBCATEGORY[p.id] })),
  ...generated,
];
