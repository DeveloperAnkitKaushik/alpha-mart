"use server";

import { updateTag } from "next/cache";
import { db } from "@/lib/server/db";
import { siteContent } from "@/lib/server/db/schema";
import { AuthError, requireAdmin } from "@/lib/server/auth";
import { siteContentSchema } from "@/lib/site-content";
import { SITE_TAG } from "@/lib/site-content-server";

export type PublishResult = { ok: true } | { ok: false; error: string };

export async function publishSiteContent(input: unknown): Promise<PublishResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "Your session expired or this account isn't an admin. Sign in again." };
    throw e;
  }
  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Some fields are invalid." };

  const json = JSON.stringify(parsed.data);
  const updatedAt = new Date();
  try {
    await db().insert(siteContent).values({ id: 1, json, updatedAt }).onDuplicateKeyUpdate({ set: { json, updatedAt } });
  } catch {
    return { ok: false, error: "Couldn't save right now. Your changes are still here, try again." };
  }
  updateTag(SITE_TAG);
  return { ok: true };
}
