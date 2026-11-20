export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "failed",
  "expired",
  "cancelled",
  "refunded",
  "needs_attention",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PgState = "PENDING" | "COMPLETED" | "FAILED";
export type Effect = { status: OrderStatus; stock: "none" | "release" | "reserve"; couponUses: -1 | 0 | 1 };

export function paymentEffect(status: OrderStatus, pg: PgState, holdExpired: boolean, stockAvailable: boolean): Effect {
  if (status === "pending_payment") {
    if (pg === "COMPLETED") return { status: "paid", stock: "none", couponUses: 0 };
    if (pg === "FAILED") return { status: holdExpired ? "expired" : "failed", stock: "release", couponUses: -1 };
  }
  if ((status === "expired" || status === "failed") && pg === "COMPLETED") {
    return stockAvailable
      ? { status: "paid", stock: "reserve", couponUses: 1 }
      : { status: "needs_attention", stock: "none", couponUses: 0 };
  }
  return { status, stock: "none", couponUses: 0 };
}

export const STAFF_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  paid: ["packed", "cancelled", "refunded"],
  packed: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  failed: [],
  expired: [],
  cancelled: [],
  refunded: [],
  // Straight to shipped: its units were never reserved, so it must never reach packed → cancelled, which restocks.
  needs_attention: ["shipped", "refunded"],
};

export function staffEffect(from: OrderStatus, to: OrderStatus): { ok: true; restock: boolean } | { ok: false } {
  return STAFF_NEXT[from].includes(to) ? { ok: true, restock: to === "cancelled" } : { ok: false };
}
