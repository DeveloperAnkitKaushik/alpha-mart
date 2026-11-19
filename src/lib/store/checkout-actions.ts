"use server";

import { z } from "zod";
import { loadCatalog } from "@/lib/server/catalog";
import { serverEnv } from "@/lib/server/env";
import { AuthError, requireUser } from "@/lib/server/firebase-admin";
import { customerUsedCoupon, quoteCoupon, reserveOrder, settleOrder, sweepExpired } from "@/lib/server/orders";
import { createPayment } from "@/lib/server/phonepe";
import { priceLines, type PricedLine } from "@/lib/store/pricing";
import { addressSchema, cartLineSchema, couponCodeSchema, type CartLine } from "@/lib/store/schemas";

type Failure = { ok: false; error: string };

const linesSchema = z.array(cartLineSchema).min(1).max(20);
const codeSchema = couponCodeSchema.nullable();
const SESSION_EXPIRED: Failure = { ok: false, error: "Your session expired. Sign in again." };

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
  try {
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

    try {
      const { checkoutUrl } = await createPayment({
        merchantOrderId: order.orderId,
        amount: order.total,
        redirectUrl: `${serverEnv().SITE_URL}/orders/${order.orderId}`,
      });
      return { ok: true, checkoutUrl };
    } catch {
      await settleOrder(order.orderId, { state: "FAILED", transactionId: null });
      return { ok: false, error: "PhonePe is not responding. Nothing was charged, try again." };
    }
  } catch (e) {
    if (e instanceof AuthError) return SESSION_EXPIRED;
    throw e;
  }
}
