"use client";

import { useEffect, useState } from "react";
import { HomeSections } from "@/components/shop/home-sections";
import { SiteContentProvider } from "@/components/site/site-content";
import type { SiteContent } from "@/lib/site-content";

export const PREVIEW_READY = "alpha-preview-ready";
export const PREVIEW_CONTENT = "alpha-preview-content";

// Renders the home page with the admin's unsaved draft, sent by the dashboard that embeds this page.
// Opened on its own, it shows the published home page.
export function DraftPreview() {
  const [draft, setDraft] = useState<SiteContent | null>(null);

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (e: MessageEvent<{ type?: string; content?: SiteContent }>) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      if (e.data?.type === PREVIEW_CONTENT && e.data.content) setDraft(e.data.content);
    };
    // Links would navigate the preview away from the draft.
    const blockLinks = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a")) e.preventDefault();
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("click", blockLinks, true);
    window.parent.postMessage({ type: PREVIEW_READY }, location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", blockLinks, true);
    };
  }, []);

  return draft ? (
    <SiteContentProvider content={draft}>
      <HomeSections />
    </SiteContentProvider>
  ) : (
    <HomeSections />
  );
}
