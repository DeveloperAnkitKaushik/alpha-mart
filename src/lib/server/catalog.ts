import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { siteContent } from "@/lib/server/db/schema";
import { DEFAULT_CONTENT, siteContentSchema, type SiteContent } from "@/lib/site-content";

// Uncached on purpose: checkout prices must come from the latest published catalogue.
export async function loadCatalog(): Promise<SiteContent> {
  const [row] = await db().select({ json: siteContent.json }).from(siteContent).where(eq(siteContent.id, 1)).limit(1);
  if (!row) return DEFAULT_CONTENT;
  return siteContentSchema.parse(JSON.parse(row.json));
}
