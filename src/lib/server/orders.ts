import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/lib/server/db";
import { coupons, orders, stock } from "@/lib/server/db/schema";
import { randomId } from "@/lib/server/random-id";
import { getPaymentState, PaymentNotFoundError } from "@/lib/server/phonepe";
import { paymentEffect, type OrderStatus, type PgState } from "@/lib/store/order-state";
import { checkStock, couponDiscount, type PricedLine } from "@/lib/store/pricing";
import { couponSchema, type Address, type CartLine, type Coupon } from "@/lib/store/schemas";

export type OrderDoc = {
  uid: string;
  items: PricedLine[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  total: number;
  address: Address;
  status: OrderStatus;
  phonepe: { state: PgState | null; transactionId: string | null };
  reservedUntil: Date;
  createdAt: Date;
  updatedAt: Date;
  trackingNote: string;
  checkoutUrl?: string;
};

export type OrderView = Omit<OrderDoc, "uid" | "reservedUntil" | "createdAt" | "updatedAt" | "checkoutUrl"> & {
  id: string;
  reservedUntil: string;
  createdAt: string;
  updatedAt: string;
  checkoutUrl: string | null;
};

type OrderRow = typeof orders.$inferSelect;

export function toOrderDoc({ pgState, pgTransactionId, checkoutUrl, ...row }: OrderRow): OrderDoc {
  return { ...row, phonepe: { state: pgState, transactionId: pgTransactionId }, ...(checkoutUrl ? { checkoutUrl } : {}) };
}

// The PhonePe link goes only to the order's owner, and only while the hold is live.
export function toOrderView(id: string, { checkoutUrl, ...order }: Omit<OrderDoc, "uid">, isOwner = false): OrderView {
  const payable = isOwner && order.status === "pending_payment" && order.reservedUntil.getTime() > Date.now();
  return {
    ...order,
    id,
    checkoutUrl: payable ? (checkoutUrl ?? null) : null,
    reservedUntil: order.reservedUntil.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

type Failure = { ok: false; error: string };

export class OrderNotFoundError extends Error {}

const HOLD_MS = 20 * 60 * 1000;
// Orders that keep a coupon use: pending ones hold it, fulfilled ones spent it.
const HOLDS_COUPON: OrderStatus[] = ["pending_payment", "paid", "packed", "shipped", "delivered"];
// Expired stays here because a late payment can still complete it.
const RECONCILABLE: OrderStatus[] = ["pending_payment", "expired"];

const readCoupon = (row: unknown): Coupon | null => couponSchema.safeParse(row).data ?? null;

async function couponRow(q: Tx | Db, code: string, lock: boolean) {
  const query = q.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  return (await (lock ? query.for("update") : query))[0];
}

function qtyByProduct(lines: CartLine[]): Map<string, number> {
  const qty = new Map<string, number>();
  for (const l of lines) qty.set(l.productId, (qty.get(l.productId) ?? 0) + l.qty);
  return qty;
}

// A missing stock row counts as 0 available.
async function readStock(tx: Tx, lines: CartLine[]): Promise<Record<string, number>> {
  const ids = [...qtyByProduct(lines).keys()];
  if (!ids.length) return {};
  const rows = await tx.select({ id: stock.productId, available: stock.available }).from(stock).where(inArray(stock.productId, ids)).for("update");
  return Object.fromEntries(rows.map((r) => [r.id, Math.max(0, r.available)]));
}

export async function moveStock(tx: Tx, lines: CartLine[], sign: 1 | -1) {
  const updatedAt = new Date();
  for (const [productId, qty] of qtyByProduct(lines)) {
    await tx
      .insert(stock)
      .values({ productId, available: sign * qty, updatedAt })
      .onDuplicateKeyUpdate({ set: { available: sql`${stock.available} + ${sign * qty}`, updatedAt } });
  }
}

export async function customerUsedCoupon(uid: string, code: string): Promise<boolean> {
  const used = await db()
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.uid, uid), eq(orders.couponCode, code), inArray(orders.status, HOLDS_COUPON)))
    .limit(1);
  return used.length > 0;
}

// Display-only quote; reserveOrder re-checks the coupon inside its transaction.
export async function quoteCoupon(
  uid: string | null,
  code: string,
  subtotal: number,
): Promise<{ ok: true; discount: number } | Failure> {
  const coupon = readCoupon(await couponRow(db(), code, false));
  const usedIt = coupon?.oncePerCustomer && uid ? await customerUsedCoupon(uid, code) : false;
  return couponDiscount(coupon, code, subtotal, new Date(), usedIt);
}

export async function reserveOrder(o: {
  uid: string;
  lines: PricedLine[];
  subtotal: number;
  code: string | null;
  customerUsedIt: boolean;
  address: Address;
}): Promise<{ ok: true; orderId: string; total: number } | Failure> {
  return db().transaction(async (tx): Promise<{ ok: true; orderId: string; total: number } | Failure> => {
    const available = await readStock(tx, o.lines);
    const short = checkStock(o.lines, available, Object.fromEntries(o.lines.map((l) => [l.productId, l.name])));
    if (short) return { ok: false, error: short };
    let discount = 0;
    if (o.code) {
      const c = couponDiscount(readCoupon(await couponRow(tx, o.code, true)), o.code, o.subtotal, new Date(), o.customerUsedIt);
      if (!c.ok) return c;
      discount = c.discount;
    }
    const total = o.subtotal - discount;
    // PhonePe's minimum payment is ₹1.
    if (total < 1) return { ok: false, error: "This order total is too low to pay online" };

    await moveStock(tx, o.lines, -1);
    if (o.code) await tx.update(coupons).set({ uses: sql`${coupons.uses} + 1` }).where(eq(coupons.code, o.code));
    // 20 alphanumerics: the PhonePe webhook validates this shape.
    const orderId = randomId();
    const now = new Date();
    await tx.insert(orders).values({
      id: orderId,
      uid: o.uid,
      items: o.lines,
      subtotal: o.subtotal,
      discount,
      couponCode: o.code,
      total,
      address: o.address,
      status: "pending_payment",
      pgState: null,
      pgTransactionId: null,
      reservedUntil: new Date(now.getTime() + HOLD_MS),
      createdAt: now,
      updatedAt: now,
      trackingNote: "",
    });
    return { ok: true, orderId, total };
  });
}

// The only place a payment outcome moves an order's status, stock and coupon uses.
export async function settleOrder(
  orderId: string,
  pg: { state: PgState; transactionId: string | null },
): Promise<OrderStatus> {
  return db().transaction(async (tx) => {
    const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for("update");
    if (!row) throw new OrderNotFoundError(orderId);
    const order = toOrderDoc(row);
    const paidLate = (order.status === "expired" || order.status === "failed") && pg.state === "COMPLETED";
    const stockAvailable = paidLate && checkStock(order.items, await readStock(tx, order.items), {}) === null;
    const effect = paymentEffect(order.status, pg.state, order.reservedUntil.getTime() < Date.now(), stockAvailable);
    if (effect.status === order.status) return order.status;
    const coupon = effect.couponUses !== 0 && order.couponCode ? readCoupon(await couponRow(tx, order.couponCode, true)) : null;

    if (effect.stock !== "none") await moveStock(tx, order.items, effect.stock === "release" ? 1 : -1);
    if (coupon && order.couponCode && coupon.uses + effect.couponUses >= 0) {
      await tx.update(coupons).set({ uses: sql`${coupons.uses} + ${effect.couponUses}` }).where(eq(coupons.code, order.couponCode));
    }
    await tx
      .update(orders)
      .set({ status: effect.status, pgState: pg.state, pgTransactionId: pg.transactionId, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return effect.status;
  });
}

export async function reconcileOrder(orderId: string): Promise<OrderStatus> {
  const [order] = await db().select({ status: orders.status, reservedUntil: orders.reservedUntil }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new OrderNotFoundError(orderId);
  if (!RECONCILABLE.includes(order.status)) return order.status;
  let pg: Awaited<ReturnType<typeof getPaymentState>>;
  try {
    pg = await getPaymentState(orderId);
  } catch (e) {
    if (!(e instanceof PaymentNotFoundError)) throw e;
    // PhonePe never saw this order (we died before or during createPayment): release it once the hold lapses.
    if (order.reservedUntil.getTime() >= Date.now()) return order.status;
    pg = { state: "FAILED", transactionId: null };
  }
  return settleOrder(orderId, pg);
}

export async function sweepExpired(): Promise<void> {
  const expired = await db()
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending_payment"), lt(orders.reservedUntil, new Date())))
    .limit(50);
  // A PhonePe outage must not block new checkouts; the next sweep retries.
  await Promise.allSettled(expired.map((o) => reconcileOrder(o.id)));
}
