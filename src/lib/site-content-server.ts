import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/server/db";
import { siteContent } from "@/lib/server/db/schema";
import { DEFAULT_CONTENT, siteContentSchema, type SiteContent } from "@/lib/site-content";

export const SITE_TAG = "site-content";

export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SITE_TAG);
  try {
    const [row] = await db().select({ json: siteContent.json }).from(siteContent).where(eq(siteContent.id, 1)).limit(1);
    // One Node process serves the site, so publishing's updateTag refreshes this straight away.
    cacheLife("max");
    return row ? siteContentSchema.parse(JSON.parse(row.json)) : DEFAULT_CONTENT;
  } catch {
    // Database unreachable or the row is malformed: serve the built-in content and try again shortly.
    cacheLife("minutes");
    return DEFAULT_CONTENT;
  }
}
