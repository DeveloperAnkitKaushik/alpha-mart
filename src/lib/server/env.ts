import { z } from "zod";

const serviceAccount = z
  .string()
  .min(1)
  .transform((v, ctx) => {
    try {
      return z.record(z.string(), z.unknown()).parse(JSON.parse(Buffer.from(v, "base64").toString("utf8")));
    } catch {
      ctx.addIssue({ code: "custom", message: "invalid base64 service account JSON" });
      return z.NEVER;
    }
  });

const serverSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT: serviceAccount,
  SITE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
});

const phonepeSchema = z.object({
  PHONEPE_CLIENT_ID: z.string().min(1),
  PHONEPE_CLIENT_SECRET: z.string().min(1),
  PHONEPE_CLIENT_VERSION: z.string().min(1),
  PHONEPE_ENV: z.enum(["sandbox", "production"]),
  PHONEPE_WEBHOOK_USERNAME: z.string().min(1),
  PHONEPE_WEBHOOK_PASSWORD: z.string().min(1),
});

function lazy<S extends z.ZodType>(schema: S): () => z.output<S> {
  let cached: z.output<S> | undefined;
  return () => {
    if (cached) return cached;
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Store env not configured: ${String(parsed.error.issues[0].path[0])}`);
    }
    cached = parsed.data;
    return cached;
  };
}

// Only successes are memoised, so a failed read never sticks.
export const serverEnv = lazy(serverSchema);
export const phonepeEnv = lazy(phonepeSchema);
