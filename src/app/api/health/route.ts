import { sql } from "drizzle-orm";
import { db } from "@/lib/server/db";

// Reports only whether env is present and the database answers; never values.
export async function GET() {
  const env = Object.fromEntries(["DATABASE_URL", "BETTER_AUTH_SECRET", "SITE_URL", "STORE_ENABLED"].map((k) => [k, Boolean(process.env[k])]));
  let database: string;
  try {
    await db().execute(sql`SELECT 1`);
    database = "ok";
  } catch (e) {
    database = (e as { code?: string }).code ?? (e instanceof Error && e.message.startsWith("Store env") ? e.message : "error");
  }
  return Response.json({ env, database }, { headers: { "Cache-Control": "no-store" } });
}
