import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { z } from "zod";
import { useAuth } from "@/lib/auth-store";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { watchFavorites } from "./client-data";
import { cartLineSchema, type CartLine } from "./schemas";

const MAX_QTY = 10;
const MAX_LINES = 30;

const lineKey = (l: CartLine) =>
  JSON.stringify([l.productId, Object.entries(l.options).sort(([a], [b]) => a.localeCompare(b))]);

function parseLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((l) => {
    const r = cartLineSchema.safeParse(l);
    return r.success ? [r.data] : [];
  });
}

function mergeLines(...lists: CartLine[][]): CartLine[] {
  const byKey = new Map<string, CartLine>();
  for (const l of lists.flat()) {
    const k = lineKey(l);
    const prev = byKey.get(k);
    byKey.set(k, prev ? { ...prev, qty: Math.min(MAX_QTY, prev.qty + l.qty) } : l);
  }
  return [...byKey.values()];
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
      add: (line) => set((s) => ({ lines: mergeLines(s.lines, [line]) })),
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

const cartDoc = (uid: string) => doc(getDb(), "carts", uid);
const remoteCart = z.object({ items: z.array(z.unknown()) });

const pushCart = (uid: string, lines: CartLine[]) =>
  setDoc(cartDoc(uid), { items: lines.slice(0, MAX_LINES) });

let started = false;
export function startCartSync() {
  if (started) return;
  started = true;
  useCart.persist.rehydrate();
  if (!isFirebaseConfigured) return;

  let syncUid: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  useCart.subscribe((s) => {
    if (!syncUid) return;
    const uid = syncUid;
    clearTimeout(timer);
    timer = setTimeout(() => void pushCart(uid, s.lines).catch(() => {}), 800);
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
      const snap = await getDoc(cartDoc(uid));
      if (lastUid !== uid) return;
      const remote = remoteCart.safeParse(snap.data());
      const merged = mergeLines(remote.success ? parseLines(remote.data.items) : [], useCart.getState().lines);
      useCart.setState({ lines: merged });
      await pushCart(uid, merged);
      if (lastUid === uid) syncUid = uid;
    } catch {
      // Cart stays local; the next sign-in retries the merge.
    }
  };
  useAuth.subscribe((s) => void onUser(s.user?.uid ?? null));
  void onUser(useAuth.getState().user?.uid ?? null);
}
