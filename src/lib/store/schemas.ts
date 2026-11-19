import { z } from "zod";

export const cartLineSchema = z.object({
  productId: z.string().max(80),
  options: z.record(z.string().max(40), z.string().max(40)),
  qty: z.number().int().min(1).max(10),
});

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  line1: z.string().trim().min(5).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
});

export const couponCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/);

export const couponSchema = z.object({
  type: z.enum(["flat", "percent"]),
  value: z.number().int().positive(),
  maxDiscount: z.number().int().positive().nullable(),
  minOrder: z.number().int().min(0),
  expiresAt: z.string(), // YYYY-MM-DD, valid through the end of that day in IST
  active: z.boolean(),
  maxUses: z.number().int().positive().nullable(),
  oncePerCustomer: z.boolean(),
  uses: z.number().int().min(0),
});

export type CartLine = z.infer<typeof cartLineSchema>;
export type Address = z.output<typeof addressSchema>;
export type Coupon = z.infer<typeof couponSchema>;
