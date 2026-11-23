import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
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
  productId: z.string().min(1).max(80),
  supplierId: z.string().min(1).max(80),
  name: z.string().min(2, "Enter your name").max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  quantity: z.string().min(1, "Enter a quantity").max(40),
  message: z.string().max(500).optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const requirementSchema = z.object({
  title: z.string().min(3, "Tell us what you need").max(200),
  category: z.string().min(1, "Pick a category").max(80),
  quantity: z.string().min(1, "Enter a quantity").max(40),
  city: z.string().min(2, "Enter a city").max(80),
  budget: z.string().max(80).optional(),
  details: z.string().max(1000).optional(),
  name: z.string().min(2, "Enter your name").max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
});
export type RequirementInput = z.infer<typeof requirementSchema>;

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
