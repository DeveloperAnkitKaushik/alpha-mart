// Run: TEST_DATABASE_URL=mysql://alpha:alpha-dev@127.0.0.1:3306/alpha_mart_test npx vitest run src/lib/server/orders.db.test.ts
import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/server/db";
import { coupons, orders, stock } from "@/lib/server/db/schema";
import { reserveOrder, settleOrder } from "@/lib/server/orders";

vi.mock("@/lib/server/phonepe", () => ({ getPaymentState: vi.fn(), PaymentNotFoundError: class extends Error {} }));

const url = process.env.TEST_DATABASE_URL;
const address = { name: "Test User", phone: "9876543210", line1: "1 Test Street", line2: "", city: "Pune", state: "MH", pincode: "411001" };
const line = (qty: number) => ({ productId: "p1", options: {}, qty, name: "Laptop", unitPrice: 500 });
const reserve = (qty: number, code: string | null = null) =>
  reserveOrder({ uid: "u1", lines: [line(qty)], subtotal: 500 * qty, code, customerUsedIt: false, address });

const available = async () => (await db().select().from(stock).where(eq(stock.productId, "p1")))[0]?.available;
const uses = async () => (await db().select().from(coupons).where(eq(coupons.code, "SAVE10")))[0]?.uses;
const setStock = (n: number) => db().insert(stock).values({ productId: "p1", available: n, updatedAt: new Date() });

describe.skipIf(!url)("orders on MariaDB", () => {
  beforeAll(() => {
    // db() reads env lazily, so setting it here still precedes the first connection.
    process.env.DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET ??= "x".repeat(32);
    process.env.SITE_URL ??= "http://localhost:3000";
  });

  beforeEach(async () => {
    for (const t of ["orders", "stock", "coupons"]) await db().execute(sql.raw(`TRUNCATE TABLE ${t}`));
  });

  it("reserves stock and refuses an order the stock can't cover", async () => {
    await setStock(2);
    expect((await reserve(2)).ok).toBe(true);
    expect(await available()).toBe(0);
    expect(await reserve(1)).toEqual({ ok: false, error: "Laptop is out of stock" });
  });

  it("gives back stock and the coupon use when payment fails", async () => {
    await setStock(5);
    await db().insert(coupons).values({
      code: "SAVE10", type: "flat", value: 100, maxDiscount: null, minOrder: 0, expiresAt: "2099-12-31", active: true, maxUses: null, oncePerCustomer: false, uses: 0,
    });
    const r = await reserve(2, "SAVE10");
    if (!r.ok) throw new Error(r.error);
    expect(r.total).toBe(900);
    expect([await available(), await uses()]).toEqual([3, 1]);

    expect(await settleOrder(r.orderId, { state: "FAILED", transactionId: null })).toBe("failed");
    expect([await available(), await uses()]).toEqual([5, 0]);
  });

  it("re-reserves stock when a payment completes after the hold expired", async () => {
    await setStock(3);
    const r = await reserve(1);
    if (!r.ok) throw new Error(r.error);
    await db().update(orders).set({ reservedUntil: new Date(Date.now() - 1000) }).where(eq(orders.id, r.orderId));
    expect(await settleOrder(r.orderId, { state: "FAILED", transactionId: null })).toBe("expired");
    expect(await available()).toBe(3);

    expect(await settleOrder(r.orderId, { state: "COMPLETED", transactionId: "T1" })).toBe("paid");
    expect(await available()).toBe(2);
    const [row] = await db().select().from(orders).where(eq(orders.id, r.orderId));
    expect([row?.pgState, row?.pgTransactionId]).toEqual(["COMPLETED", "T1"]);
  });

  it("sells the last unit only once under concurrent checkouts", async () => {
    await setStock(1);
    const results = await Promise.all([reserve(1), reserve(1), reserve(1)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await available()).toBe(0);
    expect(await db().select({ id: orders.id }).from(orders)).toHaveLength(1);
  });
});
