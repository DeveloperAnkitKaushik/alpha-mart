import { useQuery } from "@tanstack/react-query";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { z } from "zod";
import { getDb, isFirebaseConfigured } from "@/lib/firebase";
import { addressSchema, type Address } from "./schemas";

const stockDoc = z.object({ available: z.number().int() });

export function useStock(): Record<string, number> | undefined {
  return useQuery({
    queryKey: ["stock"],
    enabled: isFirebaseConfigured,
    staleTime: 30_000,
    queryFn: async () => {
      const snap = await getDocs(collection(getDb(), "stock"));
      const out: Record<string, number> = {};
      for (const d of snap.docs) {
        const r = stockDoc.safeParse(d.data());
        if (r.success) out[d.id] = Math.max(0, r.data.available);
      }
      return out;
    },
  }).data;
}

const NO_FAVORITES: string[] = [];
const useFavoriteIds = create<{ ids: string[] }>(() => ({ ids: NO_FAVORITES }));
const favoritesDoc = (uid: string) => doc(getDb(), "favorites", uid);

let unwatch: (() => void) | undefined;
// Called by startCartSync() on every sign-in change; one listener feeds every favourites reader.
export function watchFavorites(uid: string | null) {
  unwatch?.();
  unwatch = undefined;
  useFavoriteIds.setState({ ids: NO_FAVORITES });
  if (!uid || !isFirebaseConfigured) return;
  unwatch = onSnapshot(
    favoritesDoc(uid),
    (snap) => {
      const r = z.object({ productIds: z.array(z.string()) }).safeParse(snap.data());
      useFavoriteIds.setState({ ids: r.success ? r.data.productIds : NO_FAVORITES });
    },
    () => useFavoriteIds.setState({ ids: NO_FAVORITES }),
  );
}

export const useFavorites = () => useFavoriteIds((s) => s.ids);
export const useIsFavorite = (productId: string) => useFavoriteIds((s) => s.ids.includes(productId));

export async function toggleFavorite(uid: string, productId: string): Promise<void> {
  const ref = favoritesDoc(uid);
  const current = z.object({ productIds: z.array(z.string()) }).safeParse((await getDoc(ref)).data());
  const has = current.success && current.data.productIds.includes(productId);
  await setDoc(ref, { productIds: has ? arrayRemove(productId) : arrayUnion(productId) }, { merge: true });
}

const profileDoc = (uid: string) => doc(getDb(), "profiles", uid);

export async function loadProfile(uid: string): Promise<Address | null> {
  if (!isFirebaseConfigured) return null;
  const r = z.object({ address: addressSchema }).safeParse((await getDoc(profileDoc(uid))).data());
  return r.success ? r.data.address : null;
}

export const saveProfile = (uid: string, address: Address) => setDoc(profileDoc(uid), { address });
