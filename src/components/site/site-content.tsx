"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/site-content";

const SiteContentContext = createContext<SiteContent>(DEFAULT_CONTENT);

// The root layout passes the published content; the admin preview passes the unsaved draft.
export function SiteContentProvider({ content, children }: { content: SiteContent; children: ReactNode }) {
  return <SiteContentContext value={content}>{children}</SiteContentContext>;
}

export const useSiteContent = () => useContext(SiteContentContext);
