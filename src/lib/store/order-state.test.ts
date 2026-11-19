import { describe, expect, it } from "vitest";
import { paymentEffect, staffEffect, type OrderStatus } from "./order-state";

describe("paymentEffect", () => {
  it("COMPLETED moves pending_payment to paid without touching stock or coupon", () => {
    expect(paymentEffect("pending_payment", "COMPLETED", false, true)).toEqual({ status: "paid", stock: "none", couponUses: 0 });
  });

  it.each(["paid", "packed", "shipped", "delivered"] as const)("COMPLETED on an already-%s order changes nothing", (s) => {
    expect(paymentEffect(s, "COMPLETED", true, true)).toEqual({ status: s, stock: "none", couponUses: 0 });
  });

  it.each([true, false])("PENDING stays pending (holdExpired=%s)", (held) => {
    expect(paymentEffect("pending_payment", "PENDING", held, true)).toEqual({ status: "pending_payment", stock: "none", couponUses: 0 });
  });

  it("unpaid sweep past the hold expires", () => {
    expect(paymentEffect("pending_payment", "FAILED", true, true)).toEqual({ status: "expired", stock: "release", couponUses: -1 });
  });

  it("FAILED within the hold is failed", () => {
    expect(paymentEffect("pending_payment", "FAILED", false, true)).toEqual({ status: "failed", stock: "release", couponUses: -1 });
  });

  it("FAILED on a paid order changes nothing", () => {
    expect(paymentEffect("paid", "FAILED", false, true)).toEqual({ status: "paid", stock: "none", couponUses: 0 });
  });

  it.each(["expired", "failed"] as const)("late COMPLETED on %s order re-reserves when stock exists", (s) => {
    expect(paymentEffect(s, "COMPLETED", true, true)).toEqual({ status: "paid", stock: "reserve", couponUses: 1 });
  });

  it.each(["expired", "failed"] as const)("late COMPLETED on %s order without stock needs attention", (s) => {
    expect(paymentEffect(s, "COMPLETED", true, false)).toEqual({ status: "needs_attention", stock: "none", couponUses: 0 });
  });

  it.each(["expired", "failed", "cancelled", "refunded", "needs_attention"] as const)("non-COMPLETED on %s changes nothing", (s) => {
    expect(paymentEffect(s, "FAILED", true, true)).toEqual({ status: s, stock: "none", couponUses: 0 });
    expect(paymentEffect(s, "PENDING", true, true)).toEqual({ status: s, stock: "none", couponUses: 0 });
  });
});

describe("staffEffect", () => {
  it("allows paid to packed to shipped to delivered, and a late-paid needs_attention order to be packed", () => {
    for (const [a, b] of [["paid", "packed"], ["packed", "shipped"], ["shipped", "delivered"], ["needs_attention", "packed"]] as const) {
      expect(staffEffect(a, b)).toEqual({ ok: true, restock: false });
    }
  });

  it("restocks only when cancelling a paid or packed order", () => {
    expect(staffEffect("paid", "cancelled")).toEqual({ ok: true, restock: true });
    expect(staffEffect("packed", "cancelled")).toEqual({ ok: true, restock: true });
  });

  it.each(["paid", "packed", "shipped", "delivered", "needs_attention"] as const)("refunds from %s never restock", (s) => {
    expect(staffEffect(s, "refunded")).toEqual({ ok: true, restock: false });
  });

  it("refuses transitions outside STAFF_NEXT", () => {
    const refused: [OrderStatus, OrderStatus][] = [["delivered", "packed"], ["shipped", "cancelled"], ["pending_payment", "paid"], ["cancelled", "paid"]];
    for (const [a, b] of refused) expect(staffEffect(a, b)).toEqual({ ok: false });
  });
});
