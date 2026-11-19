import { describe, expect, it } from "vitest";
import { mergeCarts } from "./cart-merge";
import type { CartLine } from "./schemas";

describe("mergeCarts", () => {
  it("keeps the larger qty and does not grow when merged with itself", () => {
    const local: CartLine[] = [{ productId: "a", options: { ram: "8" }, qty: 2 }];
    const remote: CartLine[] = [
      { productId: "a", options: { ram: "8" }, qty: 3 },
      { productId: "b", options: {}, qty: 1 },
    ];
    const once = mergeCarts(remote, local);
    expect(once).toEqual(remote);
    expect(mergeCarts(once, once)).toEqual(once);
  });
});
