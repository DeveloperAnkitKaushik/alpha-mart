import { cacheLife } from "next/cache";
import { z } from "zod";
import { firestoreDoc } from "@/lib/site-content-server";

const imageDoc = z.object({
  fields: z.object({
    data: z.object({ stringValue: z.string() }),
    type: z.object({ stringValue: z.enum(["image/webp", "image/jpeg"]) }),
  }),
});

type Stored = { data: string; type: "image/webp" | "image/jpeg" } | { status: number };

// Image docs are write-once, so a found image is cached for good; misses are retried soon.
async function loadImage(id: string): Promise<Stored> {
  "use cache";
  const res = await fetch(firestoreDoc(`images/${id}`));
  const doc = res.ok ? imageDoc.safeParse(await res.json()) : null;
  if (!doc?.success) {
    cacheLife("seconds");
    return { status: res.ok || res.status === 404 ? 404 : 502 };
  }
  cacheLife("max");
  return { data: doc.data.fields.data.stringValue, type: doc.data.fields.type.stringValue };
}

// Serves an admin-uploaded image.
export async function GET(_req: Request, ctx: RouteContext<"/api/img/[id]">) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response(null, { status: 404 });
  const img = await loadImage(id);
  if ("status" in img) return new Response(null, { status: img.status });
  return new Response(Buffer.from(img.data, "base64"), {
    headers: {
      "Content-Type": img.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
