import { FieldValue, Timestamp, type DocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { adminDb } from "@/lib/server/firebase-admin";
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
  reservedUntil: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

// The PhonePe link goes only to the order's owner, and only while the hold is live.
export function toOrderView(id: string, { checkoutUrl, ...order }: Omit<OrderDoc, "uid">, isOwner = false): OrderView {
  const payable = isOwner && order.status === "pending_payment" && order.reservedUntil.toMillis() > Date.now();
  return {
    ...order,
    id,
    checkoutUrl: payable ? (checkoutUrl ?? null) : null,
    reservedUntil: order.reservedUntil.toDate().toISOString(),
    createdAt: order.createdAt.toDate().toISOString(),
    updatedAt: order.updatedAt.toDate().toISOString(),
  };
}

type Failure = { ok: false; error: string };

export class OrderNotFoundError extends Error {}

const HOLD_MS = 20 * 60 * 1000;
// Orders that keep a coupon use: pending ones hold it, fulfilled ones spent it.
const HOLDS_COUPON: OrderStatus[] = ["pending_payment", "paid", "packed", "shipped", "delivered"];
// Expired stays here because a late payment can still complete it.
const RECONCILABLE: OrderStatus[] = ["pending_payment", "expired"];
const stockDoc = z.object({ available: z.number().int() });

const orderRef = (id: string) => adminDb().doc(`orders/${id}`);
const stockRef = (productId: string) => adminDb().doc(`stock/${productId}`);
const couponRef = (code: string) => adminDb().doc(`coupons/${code}`);

const readCoupon = (snap: DocumentSnapshot): Coupon | null => couponSchema.safeParse(snap.data()).data ?? null;

function qtyByProduct(lines: CartLine[]): Map<string, number> {
  const qty = new Map<string, number>();
  for (const l of lines) qty.set(l.productId, (qty.get(l.productId) ?? 0) + l.qty);
  return qty;
}

// A missing or malformed stock doc counts as 0 available.
async function readStock(tx: Transaction, lines: CartLine[]): Promise<Record<string, number>> {
  const ids = [...qtyByProduct(lines).keys()];
  const snaps = ids.length ? await tx.getAll(...ids.map(stockRef)) : [];
  return Object.fromEntries(snaps.map((s) => [s.id, Math.max(0, stockDoc.safeParse(s.data()).data?.available ?? 0)]));
}

function moveStock(tx: Transaction, lines: CartLine[], sign: 1 | -1) {
  for (const [id, qty] of qtyByProduct(lines)) {
    tx.set(stockRef(id), { available: FieldValue.increment(sign * qty), updatedAt: Timestamp.now() }, { merge: true });
  }
}

export async function customerUsedCoupon(uid: string, code: string): Promise<boolean> {
  const used = await adminDb()
    .collection("orders")
    .where("uid", "==", uid)
    .where("couponCode", "==", code)
    .where("status", "in", HOLDS_COUPON)
    .limit(1)
    .get();
  return !used.empty;
}

// Display-only quote; reserveOrder re-checks the coupon inside its transaction.
export async function quoteCoupon(
  uid: string | null,
  code: string,
  subtotal: number,
): Promise<{ ok: true; discount: number } | Failure> {
  const coupon = readCoupon(await couponRef(code).get());
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
  const db = adminDb();
  return db.runTransaction(async (tx): Promise<{ ok: true; orderId: string; total: number } | Failure> => {
    const available = await readStock(tx, o.lines);
    const couponSnap = o.code ? await tx.get(couponRef(o.code)) : null;

    const short = checkStock(o.lines, available, Object.fromEntries(o.lines.map((l) => [l.productId, l.name])));
    if (short) return { ok: false, error: short };
    let discount = 0;
    if (o.code && couponSnap) {
      const c = couponDiscount(readCoupon(couponSnap), o.code, o.subtotal, new Date(), o.customerUsedIt);
      if (!c.ok) return c;
      discount = c.discount;
    }
    const total = o.subtotal - discount;
    // PhonePe's minimum payment is ₹1.
    if (total < 1) return { ok: false, error: "This order total is too low to pay online" };

    moveStock(tx, o.lines, -1);
    if (o.code) tx.update(couponRef(o.code), { uses: FieldValue.increment(1) });
    const ref = db.collection("orders").doc();
    const now = Timestamp.now();
    const order: OrderDoc = {
      uid: o.uid,
      items: o.lines,
      subtotal: o.subtotal,
      discount,
      couponCode: o.code,
      total,
      address: o.address,
      status: "pending_payment",
      phonepe: { state: null, transactionId: null },
      reservedUntil: Timestamp.fromMillis(now.toMillis() + HOLD_MS),
      createdAt: now,
      updatedAt: now,
      trackingNote: "",
    };
    tx.create(ref, order);
    return { ok: true, orderId: ref.id, total };
  });
}

// The only place a payment outcome moves an order's status, stock and coupon uses.
export async function settleOrder(
  orderId: string,
  pg: { state: PgState; transactionId: string | null },
): Promise<OrderStatus> {
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(orderRef(orderId));
    if (!snap.exists) throw new OrderNotFoundError(orderId);
    const order = snap.data() as OrderDoc;
    const paidLate = (order.status === "expired" || order.status === "failed") && pg.state === "COMPLETED";
    const stockAvailable = paidLate && checkStock(order.items, await readStock(tx, order.items), {}) === null;
    const effect = paymentEffect(order.status, pg.state, order.reservedUntil.toMillis() < Date.now(), stockAvailable);
    if (effect.status === order.status) return order.status;
    const coupon = effect.couponUses !== 0 && order.couponCode ? readCoupon(await tx.get(couponRef(order.couponCode))) : null;

    if (effect.stock !== "none") moveStock(tx, order.items, effect.stock === "release" ? 1 : -1);
    if (coupon && order.couponCode && coupon.uses + effect.couponUses >= 0) {
      tx.update(couponRef(order.couponCode), { uses: FieldValue.increment(effect.couponUses) });
    }
    tx.update(snap.ref, { status: effect.status, phonepe: pg, updatedAt: Timestamp.now() });
    return effect.status;
  });
}

export async function reconcileOrder(orderId: string): Promise<OrderStatus> {
  const snap = await orderRef(orderId).get();
  if (!snap.exists) throw new OrderNotFoundError(orderId);
  const order = snap.data() as OrderDoc;
  if (!RECONCILABLE.includes(order.status)) return order.status;
  let pg: Awaited<ReturnType<typeof getPaymentState>>;
  try {
    pg = await getPaymentState(orderId);
  } catch (e) {
    if (!(e instanceof PaymentNotFoundError)) throw e;
    // PhonePe never saw this order (we died before or during createPayment): release it once the hold lapses.
    if (order.reservedUntil.toMillis() >= Date.now()) return order.status;
    pg = { state: "FAILED", transactionId: null };
  }
  return settleOrder(orderId, pg);
}

// shortcut: unordered limit 50 with an in-code expiry filter avoids a composite index; add one if pending orders ever exceed 50.
export async function sweepExpired(): Promise<void> {
  const pending = await adminDb().collection("orders").where("status", "==", "pending_payment").limit(50).get();
  const now = Date.now();
  const expired = pending.docs.filter((d) => (d.data() as OrderDoc).reservedUntil.toMillis() < now);
  // A PhonePe outage must not block new checkouts; the next sweep retries.
  await Promise.allSettled(expired.map((d) => reconcileOrder(d.id)));
}
