"use server";

import { z } from "zod";
import { AuthError, requireAdmin } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { images } from "@/lib/server/db/schema";
import { randomId } from "@/lib/server/random-id";

const MAX_BYTES = 1_500_000;
const uploadSchema = z.object({
  data: z.base64().max(Math.ceil(MAX_BYTES / 3) * 4),
  type: z.enum(["image/webp", "image/jpeg"]),
});

export type UploadResult = { ok: true; src: string } | { ok: false; error: string };

// Stores an image the browser already compressed; returns the path that serves it.
export async function uploadImageData(input: unknown): Promise<UploadResult> {
  let uid: string;
  try {
    uid = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "Your session expired or this account isn't an admin. Sign in again." };
    throw e;
  }
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This image is too large or in an unsupported format." };
  const id = randomId();
  await db().insert(images).values({ id, data: Buffer.from(parsed.data.data, "base64"), type: parsed.data.type, by: uid, createdAt: new Date() });
  return { ok: true, src: `/api/img/${id}` };
}
