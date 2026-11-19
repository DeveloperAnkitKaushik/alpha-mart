import { z } from "zod";
import { reconcileOrder } from "@/lib/server/orders";
import { isValidWebhookAuth } from "@/lib/server/phonepe";

const callback = z.object({ payload: z.object({ merchantOrderId: z.string().regex(/^[A-Za-z0-9]{20}$/) }) });

// Only the order ID is taken from the body; reconcileOrder asks PhonePe's status API for the state.
export async function POST(req: Request) {
  if (!isValidWebhookAuth(req.headers.get("authorization"))) return new Response(null, { status: 401 });
  const body = callback.safeParse(await req.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });
  await reconcileOrder(body.data.payload.merchantOrderId);
  return new Response(null, { status: 200 });
}
