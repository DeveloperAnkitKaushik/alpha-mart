"use server";

import { z } from "zod";
import { loadCatalog } from "@/lib/server/catalog";
import { desc, eq } from "drizzle-orm";
import { AuthError, currentUser, isAdminId, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { orders } from "@/lib/server/db/schema";
import { serverEnv } from "@/lib/server/env";
import { customerUsedCoupon, quoteCoupon, reconcileOrder, reserveOrder, settleOrder, sweepExpired, toOrderDoc, toOrderView, type OrderView } from "@/lib/server/orders";
import { createPayment } from "@/lib/server/phonepe";
import type { OrderStatus } from "@/lib/store/order-state";
import { priceLines, type PricedLine } from "@/lib/store/pricing";
import { addressSchema, cartLineSchema, couponCodeSchema, type CartLine } from "@/lib/store/schemas";

export type { OrderView };

type Failure = { ok: false; error: string };

const linesSchema = z.array(cartLineSchema).min(1).max(20);
const codeSchema = couponCodeSchema.nullable();
const SESSION_EXPIRED: Failure = { ok: false, error: "Your session expired. Sign in again." };
const STORE_OFF: Failure = { ok: false, error: "The store isn't taking online orders right now." };
const SWEEP_EVERY_MS = 60_000;
let lastSweep = 0;

const storeOff = () => process.env.STORE_ENABLED !== "true";

// Releases abandoned holds even when no one can reach createOrder because the product shows sold out.
async function sweepThrottled() {
  if (Date.now() - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = Date.now();
  await sweepExpired().catch(() => undefined);
}

function parseCart(lines: unknown, code: unknown): { ok: true; lines: CartLine[]; code: string | null } | Failure {
  const l = linesSchema.safeParse(lines);
  if (!l.success) return { ok: false, error: "Your cart has an item we can't read. Remove it and try again." };
  const c = codeSchema.safeParse(code);
  if (!c.success) return { ok: false, error: "Enter a valid coupon code." };
  return { ok: true, lines: l.data, code: c.data };
}

export async function previewTotals(
  lines: unknown,
  code: unknown,
): Promise<{ ok: true; subtotal: number; discount: number; total: number; lines: PricedLine[] } | Failure> {
  if (storeOff()) return STORE_OFF;
  try {
    await sweepThrottled();
    const uid = (await currentUser())?.id ?? null;
    const cart = parseCart(lines, code);
    if (!cart.ok) return cart;
    const priced = priceLines(await loadCatalog(), cart.lines);
    if (!priced.ok) return priced;
    let discount = 0;
    if (cart.code) {
      const c = await quoteCoupon(uid, cart.code, priced.subtotal);
      if (!c.ok) return c;
      discount = c.discount;
    }
    return { ok: true, subtotal: priced.subtotal, discount, total: priced.subtotal - discount, lines: priced.lines };
  } catch (e) {
    if (e instanceof AuthError) return SESSION_EXPIRED;
    throw e;
  }
}

export async function createOrder(
  lines: unknown,
  code: unknown,
  address: unknown,
): Promise<{ ok: true; checkoutUrl: string } | Failure> {
  if (storeOff()) return STORE_OFF;
  try {
    const uid = await requireUser();
    const cart = parseCart(lines, code);
    if (!cart.ok) return cart;
    const addr = addressSchema.safeParse(address);
    if (!addr.success) return { ok: false, error: "Check your delivery address." };

    await sweepExpired();
    const priced = priceLines(await loadCatalog(), cart.lines);
    if (!priced.ok) return priced;
    const order = await reserveOrder({
      uid,
      lines: priced.lines,
      subtotal: priced.subtotal,
      code: cart.code,
      customerUsedIt: cart.code ? await customerUsedCoupon(uid, cart.code) : false,
      address: addr.data,
    });
    if (!order.ok) return order;

    let checkoutUrl: string;
    try {
      ({ checkoutUrl } = await createPayment({
        merchantOrderId: order.orderId,
        amount: order.total,
        redirectUrl: `${serverEnv().SITE_URL}/orders/${order.orderId}`,
      }));
    } catch {
      await settleOrder(order.orderId, { state: "FAILED", transactionId: null });
      return { ok: false, error: "PhonePe is not responding. Nothing was charged, try again." };
    }
    // Saved so the order page can resume the payment; the customer is redirected even if this write fails.
    await db().update(orders).set({ checkoutUrl }).where(eq(orders.id, order.orderId)).catch(() => undefined);
    return { ok: true, checkoutUrl };
  } catch (e) {
    if (e instanceof AuthError) return SESSION_EXPIRED;
    throw e;
  }
}

export async function getMyOrder(
  orderId: string,
): Promise<{ ok: true; order: OrderView } | { ok: false; error: "not_found" | "auth" }> {
  try {
    const uid = await requireUser();
    if (typeof orderId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(orderId)) return { ok: false, error: "not_found" };
    const read = async () => (await db().select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    let row = await read();
    if (!row) return { ok: false, error: "not_found" };
    if (row.uid !== uid && !(await isAdminId(uid))) return { ok: false, error: "not_found" };
    if (row.status === "pending_payment" || row.status === "expired") {
      // PhonePe being unreachable must not hide the order; the page keeps polling.
      await reconcileOrder(orderId).catch(() => undefined);
      row = (await read()) ?? row;
    }
    const { uid: owner, ...order } = toOrderDoc(row);
    return { ok: true, order: toOrderView(orderId, order, owner === uid) };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "auth" };
    throw e;
  }
}

export async function listMyOrders(): Promise<
  { ok: true; orders: { id: string; total: number; status: OrderStatus; createdAt: string }[] } | { ok: false; error: "auth" }
> {
  try {
    const uid = await requireUser();
    const rows = await db()
      .select({ id: orders.id, total: orders.total, status: orders.status, createdAt: orders.createdAt })
      .from(orders)
      .where(eq(orders.uid, uid))
      .orderBy(desc(orders.createdAt))
      .limit(50);
    return { ok: true, orders: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "auth" };
    throw e;
  }
}
