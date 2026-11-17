"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { siteContentSchema } from "@/lib/site-content";
import { firestoreDoc, SITE_TAG } from "@/lib/site-content-server";

export type PublishResult = { ok: true } | { ok: false; error: string };

export async function publishSiteContent(idToken: unknown, input: unknown): Promise<PublishResult> {
  const token = z.string().min(20).safeParse(idToken);
  if (!token.success) return { ok: false, error: "Your session expired. Sign in again." };
  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Some fields are invalid." };

  const res = await fetch(`${firestoreDoc("site/content")}?updateMask.fieldPaths=json`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token.data}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(parsed.data) } } }),
  });
  if (res.status === 401) return { ok: false, error: "Your session expired. Sign in again." };
  if (res.status === 403) return { ok: false, error: "This account can't publish. Check that it's in the admins list and the latest Firestore rules are deployed." };
  if (!res.ok) return { ok: false, error: "Couldn't save right now. Your changes are still here, try again." };

  updateTag(SITE_TAG);
  return { ok: true };
}
