"use server";

import { z } from "zod";
import { loadCatalog } from "@/lib/server/catalog";
import { serverEnv } from "@/lib/server/env";
import { adminDb, AuthError, requireUser } from "@/lib/server/firebase-admin";
import { customerUsedCoupon, quoteCoupon, reconcileOrder, reserveOrder, settleOrder, sweepExpired, toOrderView, type OrderDoc, type OrderView } from "@/lib/server/orders";
import { createPayment } from "@/lib/server/phonepe";
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
  idToken: string | null,
  lines: unknown,
  code: unknown,
): Promise<{ ok: true; subtotal: number; discount: number; total: number; lines: PricedLine[] } | Failure> {
  if (storeOff()) return STORE_OFF;
  try {
    await sweepThrottled();
    const uid = idToken ? await requireUser(idToken) : null;
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
  idToken: string,
  lines: unknown,
  code: unknown,
  address: unknown,
): Promise<{ ok: true; checkoutUrl: string } | Failure> {
  if (storeOff()) return STORE_OFF;
  try {
    const uid = await requireUser(idToken);
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
    await adminDb().doc(`orders/${order.orderId}`).update({ checkoutUrl }).catch(() => undefined);
    return { ok: true, checkoutUrl };
  } catch (e) {
    if (e instanceof AuthError) return SESSION_EXPIRED;
    throw e;
  }
}

export async function getMyOrder(
  idToken: string,
  orderId: string,
): Promise<{ ok: true; order: OrderView } | { ok: false; error: "not_found" | "auth" }> {
  try {
    const uid = await requireUser(idToken);
    if (typeof orderId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(orderId)) return { ok: false, error: "not_found" };
    const ref = adminDb().doc(`orders/${orderId}`);
    let snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "not_found" };
    let { uid: owner, ...order } = snap.data() as OrderDoc;
    if (owner !== uid && !(await adminDb().doc(`admins/${uid}`).get()).exists) return { ok: false, error: "not_found" };
    if (order.status === "pending_payment" || order.status === "expired") {
      // PhonePe being unreachable must not hide the order; the page keeps polling.
      await reconcileOrder(orderId).catch(() => undefined);
      snap = await ref.get();
      ({ uid: owner, ...order } = snap.data() as OrderDoc);
    }
    return { ok: true, order: toOrderView(orderId, order, owner === uid) };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "auth" };
    throw e;
  }
}
