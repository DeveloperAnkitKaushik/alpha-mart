"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";
import { PREVIEW_CONTENT, PREVIEW_READY } from "@/components/shop/draft-preview";
import { useDraft } from "./draft-store";

const DESKTOP_WIDTH = 1440;

// A 1440px-wide desktop render of the draft, scaled to fit the column.
export function PreviewFrame() {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ scale: 0.4, height: 600 });

  useEffect(() => {
    const send = () =>
      frame.current?.contentWindow?.postMessage({ type: PREVIEW_CONTENT, content: useDraft.getState().draft }, location.origin);
    const onMessage = (e: MessageEvent<{ type?: string }>) => {
      if (e.origin === location.origin && e.source === frame.current?.contentWindow && e.data?.type === PREVIEW_READY) send();
    };
    window.addEventListener("message", onMessage);
    const unsubscribe = useDraft.subscribe((s, prev) => {
      if (s.draft !== prev.draft) send();
    });
    return () => {
      window.removeEventListener("message", onMessage);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ scale: entry.contentRect.width / DESKTOP_WIDTH, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border">
      <p className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-bold tracking-wide text-navy-deep uppercase">
        <Monitor className="size-4" aria-hidden /> Desktop preview
        <span className="ml-auto font-medium tracking-normal text-muted-foreground normal-case">Unsaved changes show here live</span>
      </p>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden bg-cream">
        <iframe
          ref={frame}
          src="/preview"
          title="Desktop preview of the home page with your changes"
          className="absolute top-0 left-0 origin-top-left border-0"
          // tokens-ok: the frame must be exactly desktop width, then scaled to fit.
          style={{ width: DESKTOP_WIDTH, height: size.height / size.scale, transform: `scale(${size.scale})` }}
        />
      </div>
    </div>
  );
}
