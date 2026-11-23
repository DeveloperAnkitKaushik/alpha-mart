"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, RotateCcw, UploadCloud } from "lucide-react";
import { Tabs } from "@base-ui/react/tabs";
import { TabBar } from "../tab-bar";
import { useSiteContent } from "@/components/site/site-content";
import { publishSiteContent } from "@/lib/publish-content";
import { siteContentSchema, type SiteContent } from "@/lib/site-content";
import { cn } from "@/lib/utils";
import { BannersEditor } from "./banners-editor";
import { CategoriesEditor } from "./categories-editor";
import { getDraft, loadDraft, useDraft, useIsDirty } from "./draft-store";
import { PreviewFrame } from "./preview-frame";
import { ProductsEditor } from "./products-editor";
import { SaleEditor } from "./sale-editor";
import { StatsEditor } from "./stats-editor";
import { TypesEditor } from "./types-editor";

const SECTIONS = [
  { key: "banners", label: "Banners", Editor: BannersEditor },
  { key: "sale", label: "Sale", Editor: SaleEditor },
  { key: "stats", label: "Stats", Editor: StatsEditor },
  { key: "categories", label: "Categories", Editor: CategoriesEditor },
  { key: "products", label: "Products", Editor: ProductsEditor },
  { key: "types", label: "Types", Editor: TypesEditor },
] as const;
type Section = (typeof SECTIONS)[number]["key"];
const SECTION_TABS = SECTIONS.map((s) => ({ value: s.key, label: s.label }));

const isDirtyNow = () => {
  const s = useDraft.getState();
  return s.draft !== null && JSON.stringify(s.draft) !== s.published;
};

// Turns the first validation issue into "where: what" and the tab to open.
function describeIssue(d: SiteContent, path: PropertyKey[], message: string): { tab: Section; text: string } {
  const [section, index] = path;
  const i = typeof index === "number" ? index : -1;
  switch (section) {
    case "banners":
      return { tab: "banners", text: `Banner ${i + 1}: ${message}` };
    case "stats":
      return { tab: "stats", text: `Stat ${i + 1}: ${message}` };
    case "categories":
      return { tab: "categories", text: `Category “${d.categories[i]?.label ?? i + 1}”: ${message}` };
    case "types":
      return { tab: "types", text: `Type “${d.types[i]?.name ?? i + 1}”: ${message}` };
    case "products":
      return { tab: "products", text: `Product “${d.products[i]?.name ?? i + 1}”: ${message}` };
    default:
      return { tab: "sale", text: `Sale: ${message}` };
  }
}

function PublishBar({ onIssue }: { onIssue: (tab: Section) => void }) {
  const router = useRouter();
  const published = useSiteContent();
  const dirty = useIsDirty();
  const [busy, setBusy] = useState(false);

  const discard = () => {
    if (confirm("Throw away all unpublished changes?")) loadDraft(published);
  };

  const publish = async () => {
    const draft = getDraft();
    if (!draft) return;
    const parsed = siteContentSchema.safeParse(draft);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const { tab, text } = describeIssue(draft, issue.path, issue.message);
      onIssue(tab);
      toast.error("Can't publish yet", { description: text });
      return;
    }
    setBusy(true);
    try {
      const res = await publishSiteContent(parsed.data);
      if (!res.ok) {
        toast.error("Not published", { description: res.error });
        return;
      }
      // Edits made while publishing stay in the draft and still count as unpublished.
      if (JSON.stringify(getDraft()) === JSON.stringify(draft)) loadDraft(parsed.data);
      else useDraft.setState({ published: JSON.stringify(parsed.data) });
      router.refresh();
      toast.success("Published", { description: "The live site now shows your changes." });
    } catch {
      toast.error("Not published", { description: "Network problem. Your changes are still here, try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-2xl bg-navy-deep px-4 py-3 text-white shadow-lg">
      <span className={cn("size-2.5 rounded-full", dirty ? "bg-amber-400" : "bg-emerald-400")} aria-hidden />
      <p className="text-sm font-semibold" aria-live="polite">
        {dirty ? "Unpublished changes" : "Live site is up to date"}
      </p>
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={discard} disabled={!dirty || busy} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ring-1 ring-white/30 transition hover:bg-white/10 disabled:opacity-40">
          <RotateCcw className="size-4" /> Discard
        </button>
        <button type="button" onClick={() => void publish()} disabled={!dirty || busy} className="inline-flex h-11 items-center gap-2 rounded-full bg-ember px-5 text-sm font-bold transition hover:brightness-110 disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />} Publish
        </button>
      </div>
    </div>
  );
}

export function ItemsView() {
  const published = useSiteContent();
  // Start the draft from the published content once; it then survives switching tabs.
  useState(() => {
    if (!getDraft()) loadDraft(published);
  });
  const [tab, setTab] = useState<Section>("banners");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (isDirtyNow()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return (
    <div className="space-y-4">
      <PublishBar onIssue={setTab} />
      <div className={cn("grid gap-6", showPreview && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
        <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Section)} className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TabBar label="Content sections" size="sm" tabs={SECTION_TABS} />
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
              className="ml-auto inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-navy ring-1 ring-border hover:bg-white"
            >
              {showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {showPreview ? "Hide preview" : "Show preview"}
            </button>
          </div>
          {SECTIONS.map(({ key, Editor }) => (
            <Tabs.Panel key={key} value={key} className="mt-4 outline-none">
              <Editor />
            </Tabs.Panel>
          ))}
        </Tabs.Root>
        {showPreview && (
          <div className="h-[70vh] xl:sticky xl:top-24 xl:h-[calc(100dvh-8rem)]">
            <PreviewFrame />
          </div>
        )}
      </div>
    </div>
  );
}
