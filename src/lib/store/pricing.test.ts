import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, findType, offeredOptions, type SiteContent } from "@/lib/site-content";
import { checkStock, couponDiscount, priceLines } from "@/lib/store/pricing";
import type { CartLine, Coupon } from "@/lib/store/schemas";

const product = DEFAULT_CONTENT.products.find(
  (p) => offeredOptions(findType(DEFAULT_CONTENT.types, p), p).filter((g) => g.values.length > 1).length >= 2,
);
if (!product) throw new Error("fixture: no product with two option groups in DEFAULT_CONTENT");
const content: SiteContent = { ...DEFAULT_CONTENT, products: [product] };
const groups = offeredOptions(findType(content.types, product), product);
const topPicks = Object.fromEntries(groups.map((g) => [g.name, g.values[g.values.length - 1]]));
const baseLine: CartLine = { productId: product.id, options: Object.fromEntries(groups.map((g) => [g.name, g.values[0]])), qty: 1 };

const coupon: Coupon = {
  type: "flat", value: 500, maxDiscount: null, minOrder: 0, expiresAt: "2026-12-31",
  active: true, maxUses: null, oncePerCustomer: false, uses: 0,
};
const now = new Date("2026-11-19T10:00:00Z");
const discount = (c: Partial<Coupon> | null, subtotal = 10000, used = false, at = now) =>
  couponDiscount(c && { ...coupon, ...c }, "SAVE", subtotal, at, used);

describe("priceLines", () => {
  it("prices a line as base price plus one step per index above cheapest", () => {
    const expected = groups.reduce((sum, g) => sum + (g.values.length - 1) * g.step, product.price);
    const r = priceLines(content, [{ ...baseLine, options: topPicks, qty: 3 }]);
    expect(r).toMatchObject({ ok: true, subtotal: expected * 3 });
    if (r.ok) expect(r.lines[0].unitPrice).toBe(expected);
  });

  it("rejects a line whose option is no longer offered", () => {
    const r = priceLines(content, [{ ...baseLine, options: { ...baseLine.options, [groups[0].name]: "9 PB" } }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(product.name);
  });

  it("rejects an unknown product", () => {
    expect(priceLines(content, [{ ...baseLine, productId: "nope" }]).ok).toBe(false);
  });

  it("rejects a line missing an option group the product offers", () => {
    const [, ...rest] = Object.entries(baseLine.options);
    expect(priceLines(content, [{ ...baseLine, options: Object.fromEntries(rest) }]).ok).toBe(false);
  });
});

describe("couponDiscount", () => {
  it("flat coupon takes value off, never below zero", () => {
    expect(discount({}, 10000)).toEqual({ ok: true, discount: 500 });
    expect(discount({ value: 500 }, 300)).toEqual({ ok: true, discount: 300 });
  });

  it("percent coupon respects maxDiscount", () => {
    expect(discount({ type: "percent", value: 10, maxDiscount: null }, 1999)).toEqual({ ok: true, discount: 199 });
    expect(discount({ type: "percent", value: 10, maxDiscount: 300 }, 10000)).toEqual({ ok: true, discount: 300 });
  });

  it('coupon below minOrder is refused with "Add ₹X more to use CODE"', () => {
    expect(discount({ minOrder: 12000 }, 10000)).toEqual({ ok: false, error: "Add ₹2,000 more to use SAVE" });
  });

  it("expired / inactive / missing coupon is refused", () => {
    const errors = [
      discount({ expiresAt: "2026-11-18" }),
      discount({ active: false }),
      discount(null),
    ].map((r) => (r.ok ? "" : r.error));
    expect(errors.every(Boolean)).toBe(true);
    expect(new Set(errors).size).toBe(3);
  });

  it("is valid at 23:59 IST on expiresAt and invalid at 00:00 IST the next day", () => {
    const c = { expiresAt: "2026-11-19" };
    expect(discount(c, 10000, false, new Date("2026-11-19T23:59:00+05:30")).ok).toBe(true);
    expect(discount(c, 10000, false, new Date("2026-11-20T00:00:00+05:30")).ok).toBe(false);
  });

  it("maxUses reached is refused", () => {
    expect(discount({ maxUses: 5, uses: 5 }).ok).toBe(false);
    expect(discount({ maxUses: 5, uses: 4 }).ok).toBe(true);
  });

  it("oncePerCustomer refuses when customerUsedIt", () => {
    expect(discount({ oncePerCustomer: true }, 10000, true).ok).toBe(false);
    expect(discount({ oncePerCustomer: false }, 10000, true).ok).toBe(true);
  });
});

describe("checkStock", () => {
  it("refuses the whole cart when one line exceeds stock", () => {
    const lines = [baseLine, { ...baseLine, options: topPicks }];
    expect(checkStock(lines, { [product.id]: 1 }, { [product.id]: "Dell" })).toBe("Only 1 left of Dell");
    expect(checkStock(lines, { [product.id]: 2 }, { [product.id]: "Dell" })).toBeNull();
  });
});
