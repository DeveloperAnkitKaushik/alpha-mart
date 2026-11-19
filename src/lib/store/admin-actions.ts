"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { adminAuth, adminDb, AuthError, requireAdmin } from "@/lib/server/firebase-admin";
import { sweepExpired, toOrderView, type OrderDoc, type OrderView } from "@/lib/server/orders";
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
async function asAdmin<T>(idToken: unknown, run: () => Promise<T>): Promise<T | Failure> {
  try {
    await requireAdmin(idToken);
    return await run();
  } catch (e) {
    if (e instanceof AuthError) return NOT_ADMIN;
    throw e;
  }
}

export async function listOrders(
  idToken: string,
  status: OrderStatus | "all",
): Promise<{ ok: true; orders: (OrderView & { email: string | null })[] } | Failure> {
  const filter = z.union([statusSchema, z.literal("all")]).safeParse(status);
  if (!filter.success) return { ok: false, error: "Unknown status filter." };
  return asAdmin(idToken, async () => {
    await sweepExpired();
    const orders = adminDb().collection("orders");
    // shortcut: a status filter reads every match and sorts here to avoid a composite index; add one if a status grows past a few thousand orders.
    const docs =
      filter.data === "all"
        ? (await orders.orderBy("createdAt", "desc").limit(100).get()).docs
        : (await orders.where("status", "==", filter.data).get()).docs
            .sort((a, b) => b.get("createdAt").toMillis() - a.get("createdAt").toMillis())
            .slice(0, 100);
    const uids = [...new Set(docs.map((d) => (d.data() as OrderDoc).uid))];
    const emails = new Map<string, string | null>();
    if (uids.length) {
      for (const u of (await adminAuth().getUsers(uids.map((uid) => ({ uid })))).users) emails.set(u.uid, u.email ?? null);
    }
    return {
      ok: true as const,
      orders: docs.map((d) => {
        const { uid, ...order } = d.data() as OrderDoc;
        return { ...toOrderView(d.id, order), email: emails.get(uid) ?? null };
      }),
    };
  });
}

export async function setOrderStatus(idToken: string, orderId: string, to: OrderStatus, trackingNote: string): Promise<Result> {
  const input = z.object({ orderId: orderIdSchema, to: statusSchema, note: z.string().trim().max(300) }).safeParse({ orderId, to, note: trackingNote });
  if (!input.success) return { ok: false, error: "Check the status and note (300 characters max)." };
  return asAdmin(idToken, () =>
    adminDb().runTransaction(async (tx): Promise<Result> => {
      const db = adminDb();
      const ref = db.doc(`orders/${input.data.orderId}`);
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false, error: "Order not found." };
      const order = snap.data() as OrderDoc;
      const effect = staffEffect(order.status, input.data.to);
      if (!effect.ok) return { ok: false, error: "This order can't move to that status. Reload and try again." };
      if (effect.restock) {
        const qty = new Map<string, number>();
        for (const l of order.items) qty.set(l.productId, (qty.get(l.productId) ?? 0) + l.qty);
        for (const [id, n] of qty) {
          tx.set(db.doc(`stock/${id}`), { available: FieldValue.increment(n), updatedAt: Timestamp.now() }, { merge: true });
        }
      }
      tx.update(ref, { status: input.data.to, trackingNote: input.data.note, updatedAt: Timestamp.now() });
      return { ok: true };
    }),
  );
}

export async function setStock(idToken: string, productId: string, available: number): Promise<Result> {
  const input = z.object({ id: z.string().min(1).max(80), n: z.number().int().min(0).max(999) }).safeParse({ id: productId, n: available });
  if (!input.success) return { ok: false, error: "Stock must be a whole number from 0 to 999." };
  return asAdmin(idToken, async () => {
    await adminDb().doc(`stock/${input.data.id}`).set({ available: input.data.n, updatedAt: Timestamp.now() }, { merge: true });
    return { ok: true };
  });
}

export async function listCoupons(idToken: string): Promise<{ ok: true; coupons: (Coupon & { code: string })[] } | Failure> {
  return asAdmin(idToken, async () => {
    const snap = await adminDb().collection("coupons").get();
    const coupons = snap.docs.flatMap((d) => {
      const c = couponSchema.safeParse(d.data());
      return c.success ? [{ ...c.data, code: d.id }] : [];
    });
    return { ok: true as const, coupons: coupons.sort((a, b) => a.code.localeCompare(b.code)) };
  });
}

export async function saveCoupon(idToken: string, code: string, coupon: Omit<Coupon, "uses">): Promise<Result> {
  const id = couponCodeSchema.safeParse(code);
  const data = couponInputSchema.safeParse(coupon);
  if (!id.success) return { ok: false, error: "Code must be 3 to 20 letters or digits." };
  if (!data.success) return { ok: false, error: data.error.issues[0]?.message ?? "Some coupon fields are invalid." };
  return asAdmin(idToken, () => {
    const ref = adminDb().doc(`coupons/${id.data}`);
    return adminDb().runTransaction(async (tx): Promise<Result> => {
      const uses = z.number().int().min(0).safeParse((await tx.get(ref)).get("uses")).data ?? 0;
      tx.set(ref, { ...data.data, uses });
      return { ok: true };
    });
  });
}

// Public on purpose: reveals only whether an active, unexpired coupon has this exact code.
export async function couponExists(code: string): Promise<boolean> {
  const id = couponCodeSchema.safeParse(code);
  if (!id.success) return false;
  const coupon = couponSchema.safeParse((await adminDb().doc(`coupons/${id.data}`).get()).data());
  return coupon.success && couponDiscount(coupon.data, id.data, coupon.data.minOrder, new Date(), false).ok;
}
