import { create } from "zustand";
import type { SiteContent } from "@/lib/site-content";

// The admin's unsaved copy of the site content. `published` is the JSON last loaded or published.
interface DraftState {
  draft: SiteContent | null;
  published: string;
}

export const useDraft = create<DraftState>(() => ({ draft: null, published: "" }));

export const loadDraft = (content: SiteContent) =>
  useDraft.setState({ draft: structuredClone(content), published: JSON.stringify(content) });

export const editDraft = (fn: (d: SiteContent) => SiteContent) =>
  useDraft.setState((s) => (s.draft ? { draft: fn(s.draft) } : s));

export const useIsDirty = () => useDraft((s) => s.draft !== null && JSON.stringify(s.draft) !== s.published);

export const getDraft = () => useDraft.getState().draft;

export const replaceAt = <T,>(list: T[], i: number, item: T) => list.map((x, j) => (j === i ? item : x));
export const removeAt = <T,>(list: T[], i: number) => list.filter((_, j) => j !== i);
export function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
