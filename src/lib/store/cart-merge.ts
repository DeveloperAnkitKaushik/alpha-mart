import type { CartLine } from "./schemas";

const MAX_QTY = 10;

const lineKey = (l: CartLine) =>
  JSON.stringify([l.productId, Object.entries(l.options).sort(([a], [b]) => a.localeCompare(b))]);

function combine(lists: CartLine[][], qty: (a: number, b: number) => number): CartLine[] {
  const byKey = new Map<string, CartLine>();
  for (const l of lists.flat()) {
    const k = lineKey(l);
    const prev = byKey.get(k);
    byKey.set(k, prev ? { ...prev, qty: Math.min(MAX_QTY, qty(prev.qty, l.qty)) } : l);
  }
  return [...byKey.values()];
}

export const addLines = (...lists: CartLine[][]) => combine(lists, (a, b) => a + b);

// Larger qty wins, so merging a cart with its own copy changes nothing.
export const mergeCarts = (...lists: CartLine[][]) => combine(lists, Math.max);
