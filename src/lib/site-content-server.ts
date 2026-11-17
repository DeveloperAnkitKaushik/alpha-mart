import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { DEFAULT_CONTENT, siteContentSchema, type SiteContent } from "@/lib/site-content";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
export const SITE_TAG = "site-content";

// Firestore REST: public reads need no SDK, and writes carry the admin's own ID token so the rules decide.
export const firestoreDoc = (path: string) =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;

const storedContent = z.object({ fields: z.object({ json: z.object({ stringValue: z.string() }) }) });

export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SITE_TAG);
  if (!PROJECT) {
    cacheLife("max");
    return DEFAULT_CONTENT;
  }
  try {
    const res = await fetch(firestoreDoc("site/content"));
    if (res.status === 404) {
      cacheLife("max");
      return DEFAULT_CONTENT;
    }
    if (!res.ok) throw new Error(`Firestore responded ${res.status}`);
    const stored = storedContent.parse(await res.json());
    const content = siteContentSchema.parse(JSON.parse(stored.fields.json.stringValue));
    // updateTag only clears the instance that published; other Cloud Run instances pick it up within a minute.
    cacheLife({ stale: 60, revalidate: 60, expire: 86400 });
    return content;
  } catch {
    // Firestore unreachable or the doc is malformed: serve the built-in content and try again shortly.
    cacheLife("minutes");
    return DEFAULT_CONTENT;
  }
}
