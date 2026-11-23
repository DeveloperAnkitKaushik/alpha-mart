import { eq } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/lib/server/db";
import { images } from "@/lib/server/db/schema";

// The cache may hand back the Buffer as a plain Uint8Array.
type Stored = { data: Uint8Array; type: "image/webp" | "image/jpeg" } | { status: number };

// Images are write-once, so a found image is cached for good; misses are retried soon.
async function loadImage(id: string): Promise<Stored> {
  "use cache";
  try {
    const [row] = await db().select({ data: images.data, type: images.type }).from(images).where(eq(images.id, id)).limit(1);
    if (row) {
      cacheLife("max");
      return row;
    }
    cacheLife("seconds");
    return { status: 404 };
  } catch {
    cacheLife("seconds");
    return { status: 502 };
  }
}

// Serves an admin-uploaded image.
export async function GET(_req: Request, ctx: RouteContext<"/api/img/[id]">) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response(null, { status: 404 });
  const img = await loadImage(id);
  if ("status" in img) return new Response(null, { status: img.status });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
