import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "@/lib/auth-store";
import { watchFavorites } from "./client-data";
import { addLines, mergeCarts } from "./cart-merge";
import { cartLineSchema, type CartLine } from "./schemas";
import { getCart, saveCart } from "./user-data-actions";

const MAX_QTY = 10;
const MAX_LINES = 30;

function parseLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((l) => {
    const r = cartLineSchema.safeParse(l);
    return r.success ? [r.data] : [];
  });
}

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (i: number, qty: number) => void;
  remove: (i: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) => set((s) => ({ lines: addLines(s.lines, [line]) })),
      setQty: (i, qty) =>
        set((s) => ({
          lines: s.lines.map((l, j) => (j === i ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)),
        })),
      remove: (i) => set((s) => ({ lines: s.lines.filter((_, j) => j !== i) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "alpha-cart",
      // The server renders an empty cart, so hydration waits for startCartSync() on mount.
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines }),
      merge: (persisted, current) => ({
        ...current,
        lines: parseLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
    },
  ),
);

export const useCartCount = () => useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));

const pushCart = (lines: CartLine[]) => saveCart(lines.slice(0, MAX_LINES));

let started = false;
export function startCartSync() {
  if (started) return;
  started = true;
  useCart.persist.rehydrate();

  let syncUid: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  useCart.subscribe((s) => {
    if (!syncUid) return;
    clearTimeout(timer);
    timer = setTimeout(() => void pushCart(s.lines).catch(() => {}), 800);
  });

  let lastUid: string | null = null;
  const onUser = async (uid: string | null) => {
    if (uid === lastUid) return;
    lastUid = uid;
    syncUid = null;
    clearTimeout(timer);
    watchFavorites(uid);
    if (!uid) return;
    try {
      const remote = await getCart();
      if (lastUid !== uid) return;
      const merged = mergeCarts(remote, useCart.getState().lines);
      syncUid = uid;
      useCart.setState({ lines: merged });
    } catch {
      // Cart stays local; the next sign-in retries the merge.
    }
  };
  useAuth.subscribe((s) => void onUser(s.user?.uid ?? null));
  void onUser(useAuth.getState().user?.uid ?? null);
}
