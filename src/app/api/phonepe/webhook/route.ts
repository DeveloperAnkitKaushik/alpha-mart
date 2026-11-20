import { z } from "zod";
import { OrderNotFoundError, reconcileOrder } from "@/lib/server/orders";
import { isValidWebhookAuth } from "@/lib/server/phonepe";

const callback = z.object({ payload: z.object({ merchantOrderId: z.string().regex(/^[A-Za-z0-9]{20}$/) }) });

// Only the order ID is taken from the body; reconcileOrder asks PhonePe's status API for the state.
export async function POST(req: Request) {
  if (!isValidWebhookAuth(req.headers.get("authorization"))) return new Response(null, { status: 401 });
  const body = callback.safeParse(await req.json().catch(() => null));
  // Authenticated but not an order event (e.g. PhonePe's validation ping when the webhook is created): acknowledge, do nothing.
  if (!body.success) return new Response(null, { status: 200 });
  try {
    await reconcileOrder(body.data.payload.merchantOrderId);
  } catch (e) {
    // Unknown orders are acknowledged so PhonePe stops retrying; any other failure is a 500 and gets retried.
    if (!(e instanceof OrderNotFoundError)) throw e;
  }
  return new Response(null, { status: 200 });
}
