import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().startsWith("mysql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  SITE_URL: z.url().transform((u) => u.replace(/\/+$/, "")),
});

// Optional: without them the Google button and reset emails explain they're unavailable.
const googleSchema = z.object({ GOOGLE_CLIENT_ID: z.string().min(1), GOOGLE_CLIENT_SECRET: z.string().min(1) });
const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  MAIL_FROM: z.string().min(3),
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
export const googleEnv = () => googleSchema.safeParse(process.env).data ?? null;
export const smtpEnv = () => smtpSchema.safeParse(process.env).data ?? null;
