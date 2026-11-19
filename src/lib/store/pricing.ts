import { findType, offeredOptions, type SiteContent } from "@/lib/site-content";
import type { CartLine, Coupon } from "@/lib/store/schemas";

export type PricedLine = CartLine & { name: string; unitPrice: number };

export function priceLines(
  content: SiteContent,
  lines: CartLine[],
): { ok: true; lines: PricedLine[]; subtotal: number } | { ok: false; error: string } {
  const priced: PricedLine[] = [];
  let subtotal = 0;
  for (const line of lines) {
    const deal = content.products.find((p) => p.id === line.productId);
    if (!deal) return { ok: false, error: "An item in your cart is no longer available" };
    const groups = offeredOptions(findType(content.types, deal), deal);
    const picked = Object.keys(line.options);
    if (picked.length !== groups.length || picked.some((k) => !groups.some((g) => g.name === k))) {
      return { ok: false, error: `Choose all options for ${deal.name}` };
    }
    let unitPrice = deal.price;
    for (const g of groups) {
      const idx = g.values.indexOf(line.options[g.name]);
      if (idx < 0) return { ok: false, error: `${g.name} ${line.options[g.name]} is no longer offered for ${deal.name}` };
      unitPrice += idx * g.step;
    }
    priced.push({ ...line, name: deal.name, unitPrice });
    subtotal += unitPrice * line.qty;
  }
  return { ok: true, lines: priced, subtotal };
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function couponDiscount(
  coupon: Coupon | null,
  code: string,
  subtotal: number,
  now: Date,
  customerUsedIt: boolean,
): { ok: true; discount: number } | { ok: false; error: string } {
  if (!coupon) return { ok: false, error: `${code} is not a valid coupon` };
  if (!coupon.active) return { ok: false, error: `${code} is no longer active` };
  // Midnight IST at the start of the day after expiresAt.
  const expiryMs = Date.parse(`${coupon.expiresAt}T00:00:00Z`) + DAY_MS - IST_OFFSET_MS;
  if (now.getTime() >= expiryMs) return { ok: false, error: `${code} has expired` };
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) return { ok: false, error: `${code} has been fully redeemed` };
  if (coupon.oncePerCustomer && customerUsedIt) return { ok: false, error: `You have already used ${code}` };
  if (subtotal < coupon.minOrder) {
    return { ok: false, error: `Add ₹${(coupon.minOrder - subtotal).toLocaleString("en-IN")} more to use ${code}` };
  }
  const raw = coupon.type === "flat" ? coupon.value : Math.floor((subtotal * coupon.value) / 100);
  const capped = coupon.maxDiscount === null ? raw : Math.min(raw, coupon.maxDiscount);
  return { ok: true, discount: Math.min(capped, subtotal) };
}

export function checkStock(lines: CartLine[], available: Record<string, number>, names: Record<string, string>): string | null {
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.productId, (wanted.get(l.productId) ?? 0) + l.qty);
  for (const [id, qty] of wanted) {
    const left = available[id] ?? 0;
    if (qty > left) return left <= 0 ? `${names[id] ?? id} is out of stock` : `Only ${left} left of ${names[id] ?? id}`;
  }
  return null;
}
