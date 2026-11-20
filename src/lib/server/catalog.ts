import { z } from "zod";
import { adminDb } from "@/lib/server/firebase-admin";
import { DEFAULT_CONTENT, siteContentSchema, type SiteContent } from "@/lib/site-content";

const storedContent = z.object({ json: z.string() });

// Uncached on purpose: checkout prices must come from the latest published catalogue.
export async function loadCatalog(): Promise<SiteContent> {
  const snap = await adminDb().doc("site/content").get();
  if (!snap.exists) return DEFAULT_CONTENT;
  return siteContentSchema.parse(JSON.parse(storedContent.parse(snap.data()).json));
}
