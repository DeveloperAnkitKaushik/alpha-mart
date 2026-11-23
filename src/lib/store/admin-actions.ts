"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { coupons, orders, stock, user } from "@/lib/server/db/schema";
import { moveStock, sweepExpired, toOrderDoc, toOrderView, type OrderView } from "@/lib/server/orders";
import { couponDiscount } from "@/lib/store/pricing";
import { ORDER_STATUSES, staffEffect, type OrderStatus } from "@/lib/store/order-state";
import { couponCodeSchema, couponSchema, type Coupon } from "@/lib/store/schemas";

type Failure = { ok: false; error: string };
type Result = { ok: true } | Failure;

const NOT_ADMIN: Failure = { ok: false, error: "Your session expired or this account isn't an admin." };
const orderIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const statusSchema = z.enum(ORDER_STATUSES);
const couponInputSchema = couponSchema.omit({ uses: true });

// Turns an AuthError into the shared failure; anything else is a real fault and rethrows.
async function asAdmin<T>(run: () => Promise<T>): Promise<T | Failure> {
  try {
    await requireAdmin();
    return await run();
  } catch (e) {
    if (e instanceof AuthError) return NOT_ADMIN;
    throw e;
  }
}

export async function listOrders(
  status: OrderStatus | "all",
): Promise<{ ok: true; orders: (OrderView & { email: string | null })[] } | Failure> {
  const filter = z.union([statusSchema, z.literal("all")]).safeParse(status);
  if (!filter.success) return { ok: false, error: "Unknown status filter." };
  return asAdmin(async () => {
    await sweepExpired();
    const rows = await db()
      .select()
      .from(orders)
      .where(filter.data === "all" ? undefined : eq(orders.status, filter.data))
      .orderBy(desc(orders.createdAt))
      .limit(100);
    const uids = [...new Set(rows.map((r) => r.uid))];
    const emails = new Map(
      uids.length ? (await db().select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, uids))).map((u) => [u.id, u.email]) : [],
    );
    return {
      ok: true as const,
      orders: rows.map((r) => {
        const { uid, ...order } = toOrderDoc(r);
        return { ...toOrderView(r.id, order), email: emails.get(uid) ?? null };
      }),
    };
  });
}

export async function setOrderStatus(orderId: string, to: OrderStatus, trackingNote: string): Promise<Result> {
  const input = z.object({ orderId: orderIdSchema, to: statusSchema, note: z.string().trim().max(300) }).safeParse({ orderId, to, note: trackingNote });
  if (!input.success) return { ok: false, error: "Check the status and note (300 characters max)." };
  return asAdmin(() =>
    db().transaction(async (tx): Promise<Result> => {
      const where = eq(orders.id, input.data.orderId);
      const [order] = await tx.select({ status: orders.status, items: orders.items }).from(orders).where(where).limit(1).for("update");
      if (!order) return { ok: false, error: "Order not found." };
      const effect = staffEffect(order.status, input.data.to);
      if (!effect.ok) return { ok: false, error: "This order can't move to that status. Reload and try again." };
      if (effect.restock) await moveStock(tx, order.items, 1);
      await tx.update(orders).set({ status: input.data.to, trackingNote: input.data.note, updatedAt: new Date() }).where(where);
      return { ok: true };
    }),
  );
}

// Compare-and-set: a checkout between page load and save would otherwise be overwritten and oversold.
export async function setStock(productId: string, available: number, expected: number): Promise<Result> {
  const input = z
    .object({ id: z.string().min(1).max(80), n: z.number().int().min(0).max(999), expected: z.number().int().min(0) })
    .safeParse({ id: productId, n: available, expected });
  if (!input.success) return { ok: false, error: "Stock must be a whole number from 0 to 999." };
  return asAdmin(() =>
    db().transaction(async (tx): Promise<Result> => {
      const [row] = await tx.select({ available: stock.available }).from(stock).where(eq(stock.productId, input.data.id)).limit(1).for("update");
      // Matches useStock(): a missing row reads as 0, negatives as 0.
      if (Math.max(0, row?.available ?? 0) !== input.data.expected) {
        return { ok: false, error: "Stock changed since you loaded this page. Refresh and try again." };
      }
      const set = { available: input.data.n, updatedAt: new Date() };
      await tx.insert(stock).values({ productId: input.data.id, ...set }).onDuplicateKeyUpdate({ set });
      return { ok: true };
    }),
  );
}

export async function listCoupons(): Promise<{ ok: true; coupons: (Coupon & { code: string })[] } | Failure> {
  return asAdmin(async () => {
    const rows = await db().select().from(coupons).orderBy(coupons.code);
    const list = rows.flatMap((r) => {
      const c = couponSchema.safeParse(r);
      return c.success ? [{ ...c.data, code: r.code }] : [];
    });
    return { ok: true as const, coupons: list };
  });
}

export async function saveCoupon(code: string, coupon: Omit<Coupon, "uses">): Promise<Result> {
  const id = couponCodeSchema.safeParse(code);
  const data = couponInputSchema.safeParse(coupon);
  if (!id.success) return { ok: false, error: "Code must be 3 to 20 letters or digits." };
  if (!data.success) return { ok: false, error: data.error.issues[0]?.message ?? "Some coupon fields are invalid." };
  // The upsert leaves `uses` untouched on an existing coupon, so redemptions survive an edit.
  return asAdmin(async (): Promise<Result> => {
    await db()
      .insert(coupons)
      .values({ ...data.data, code: id.data, uses: 0 })
      .onDuplicateKeyUpdate({ set: data.data });
    return { ok: true };
  });
}

// Public on purpose: reveals only whether an active, unexpired coupon has this exact code.
export async function couponExists(code: string): Promise<boolean> {
  const id = couponCodeSchema.safeParse(code);
  if (!id.success) return false;
  const [row] = await db().select().from(coupons).where(eq(coupons.code, id.data)).limit(1);
  const coupon = couponSchema.safeParse(row);
  return coupon.success && couponDiscount(coupon.data, id.data, coupon.data.minOrder, new Date(), false).ok;
}
