import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { getFavorites, getStock, toggleFavorite as toggleFavoriteAction } from "./user-data-actions";

export { getProfile as loadProfile, saveProfile } from "./user-data-actions";

export function useStock(): Record<string, number> | undefined {
  return useQuery({
    queryKey: ["stock"],
    staleTime: 30_000,
    queryFn: () => getStock(),
  }).data;
}

const NO_FAVORITES: string[] = [];
const useFavoriteIds = create<{ ids: string[] }>(() => ({ ids: NO_FAVORITES }));

let watchedUid: string | null = null;
// Called by startCartSync() on every sign-in change; one fetch feeds every favourites reader.
export function watchFavorites(uid: string | null) {
  watchedUid = uid;
  useFavoriteIds.setState({ ids: NO_FAVORITES });
  if (!uid) return;
  getFavorites().then(
    (ids) => {
      if (watchedUid === uid) useFavoriteIds.setState({ ids });
    },
    () => undefined,
  );
}

export const useFavorites = () => useFavoriteIds((s) => s.ids);
export const useIsFavorite = (productId: string) => useFavoriteIds((s) => s.ids.includes(productId));

const withFavorite = (ids: string[], productId: string, on: boolean) =>
  on ? (ids.includes(productId) ? ids : [...ids, productId]) : ids.filter((id) => id !== productId);

export async function toggleFavorite(productId: string): Promise<void> {
  const uid = watchedUid;
  const next = !useFavoriteIds.getState().ids.includes(productId);
  useFavoriteIds.setState((s) => ({
    ids: withFavorite(s.ids, productId, next),
  }));
  try {
    const saved = await toggleFavoriteAction(productId);
    if (watchedUid === uid)
      useFavoriteIds.setState((s) => ({
        ids: withFavorite(s.ids, productId, saved),
      }));
  } catch (e) {
    if (watchedUid === uid)
      useFavoriteIds.setState((s) => ({
        ids: withFavorite(s.ids, productId, !next),
      }));
    throw e;
  }
}
