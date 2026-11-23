// Applies pending database migrations once when the Node server starts, so a deploy needs no manual SQL step.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { join } = await import("node:path");
  const { migrate } = await import("drizzle-orm/mysql2/migrator");
  const { db } = await import("@/lib/server/db");
  try {
    await migrate(db(), { migrationsFolder: join(process.cwd(), "drizzle") });
  } catch (e) {
    // A database outage must not stop the server from starting; /api/health reports the cause.
    process.stderr.write(`${JSON.stringify({ event: "migrate_failed", code: (e as { code?: string }).code ?? null })}\n`);
  }
}
