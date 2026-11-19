// Checked against developer.phonepe.com (Standard Checkout v2) on 2026-11-19.
// Confirmed: base URLs, token endpoint/form fields/response (access_token, expires_at, token_type O-Bearer),
// POST checkout/v2/pay body (amount in paise, min 100; expireAfter 300-3600s; paymentFlow PG_CHECKOUT) returning redirectUrl,
// order status path and states PENDING|FAILED|COMPLETED, paymentDetails[].transactionId, webhook Authorization = SHA256(username:password).
// Not stated in docs (kept as assumed): the "O-Bearer <token>" header string, and webhook hash being hex-encoded
// (the SDK sample is 64 hex chars). Verify against a real sandbox call.
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { phonepeEnv } from "@/lib/server/env";
import type { PgState } from "@/lib/store/order-state";

const BASE = {
  sandbox: { auth: "https://api-preprod.phonepe.com/apis/pg-sandbox", pg: "https://api-preprod.phonepe.com/apis/pg-sandbox" },
  production: { auth: "https://api.phonepe.com/apis/identity-manager", pg: "https://api.phonepe.com/apis/pg" },
} as const;

const tokenSchema = z.object({ access_token: z.string(), expires_at: z.number() });
const paySchema = z.object({ redirectUrl: z.string() });
const statusSchema = z.object({
  state: z.string(),
  paymentDetails: z.array(z.object({ transactionId: z.string(), state: z.string() })).optional(),
});

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && Date.now() < (token.expiresAt - 60) * 1000) return token.value;
  const env = phonepeEnv();
  const res = await fetch(`${BASE[env.PHONEPE_ENV].auth}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.PHONEPE_CLIENT_ID,
      client_version: env.PHONEPE_CLIENT_VERSION,
      client_secret: env.PHONEPE_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`PhonePe token request failed: ${res.status}`);
  const t = tokenSchema.parse(await res.json());
  token = { value: t.access_token, expiresAt: t.expires_at };
  return t.access_token;
}

export class PaymentNotFoundError extends Error {}

// The docs show this code ("No entry found for given merchant order id") but not its HTTP status.
const notFoundSchema = z.object({ code: z.literal("INVALID_MERCHANT_ORDER_ID") });

async function pg(path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE[phonepeEnv().PHONEPE_ENV].pg}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${await accessToken()}` },
  });
  const body: unknown = await res.json().catch(() => null);
  if (res.status === 404 || notFoundSchema.safeParse(body).success) throw new PaymentNotFoundError(path);
  if (!res.ok) throw new Error(`PhonePe request failed: ${res.status}`);
  return body;
}

export async function createPayment(p: {
  merchantOrderId: string;
  amount: number;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const body = {
    merchantOrderId: p.merchantOrderId,
    amount: p.amount * 100,
    expireAfter: 900,
    paymentFlow: { type: "PG_CHECKOUT", merchantUrls: { redirectUrl: p.redirectUrl } },
  };
  const data = paySchema.parse(await pg("/checkout/v2/pay", { method: "POST", body: JSON.stringify(body) }));
  return { checkoutUrl: data.redirectUrl };
}

export async function getPaymentState(
  merchantOrderId: string,
): Promise<{ state: PgState; transactionId: string | null }> {
  const data = statusSchema.parse(
    await pg(`/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`),
  );
  const state: PgState = data.state === "COMPLETED" || data.state === "FAILED" ? data.state : "PENDING";
  const attempts = data.paymentDetails ?? [];
  const attempt = (state === "COMPLETED" && attempts.find((a) => a.state === "COMPLETED")) || attempts.at(-1);
  return { state, transactionId: attempt?.transactionId ?? null };
}

export function isValidWebhookAuth(header: string | null): boolean {
  if (!header) return false;
  const { PHONEPE_WEBHOOK_USERNAME: u, PHONEPE_WEBHOOK_PASSWORD: p } = phonepeEnv();
  const expected = createHash("sha256").update(`${u}:${p}`).digest();
  const got = Buffer.from(header.trim().toLowerCase(), "hex");
  return got.length === expected.length && timingSafeEqual(got, expected);
}
