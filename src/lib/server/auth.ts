import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import { serverEnv } from "@/lib/server/env";
import { sendMail } from "@/lib/server/mail";

function createAuth() {
  const env = serverEnv();
  return betterAuth({
    baseURL: env.SITE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db(), { provider: "mysql", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        sendMail(user.email, "Reset your Alpha Mart password", `Open this link to set a new password (valid for 1 hour):\n\n${url}\n\nIf you didn't ask for this, ignore this email.`),
    },
    session: { cookieCache: { enabled: true, maxAge: 300 } },
  });
}

type Auth = ReturnType<typeof createAuth>;
let cached: Auth | undefined;
// Built on first request so `next build` works without database env.
export const auth = (): Auth => (cached ??= createAuth());

export class AuthError extends Error {}

export async function currentUser(): Promise<{ id: string; email: string } | null> {
  const s = await auth().api.getSession({ headers: await headers() });
  return s ? { id: s.user.id, email: s.user.email } : null;
}

export async function isAdminId(uid: string): Promise<boolean> {
  const row = await db().select({ userId: schema.admins.userId }).from(schema.admins).where(eq(schema.admins.userId, uid)).limit(1);
  return row.length > 0;
}

export async function requireUser(): Promise<string> {
  const u = await currentUser();
  if (!u) throw new AuthError("Not signed in");
  return u.id;
}

export async function requireAdmin(): Promise<string> {
  const uid = await requireUser();
  if (!(await isAdminId(uid))) throw new AuthError("Not an admin");
  return uid;
}
