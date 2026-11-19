import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const tokenRes = () => json({ access_token: "tok", expires_at: Math.floor(Date.now() / 1000) + 3600 });

async function load() {
  vi.resetModules();
  return import("./phonepe");
}

beforeEach(() => {
  vi.stubEnv("PHONEPE_CLIENT_ID", "cid");
  vi.stubEnv("PHONEPE_CLIENT_SECRET", "sec");
  vi.stubEnv("PHONEPE_CLIENT_VERSION", "1");
  vi.stubEnv("PHONEPE_ENV", "sandbox");
  vi.stubEnv("PHONEPE_WEBHOOK_USERNAME", "user");
  vi.stubEnv("PHONEPE_WEBHOOK_PASSWORD", "pass");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("phonepe client", () => {
  it("sends amount in paise and the redirect url", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(tokenRes()).mockResolvedValueOnce(json({ redirectUrl: "https://pay/x" }));
    vi.stubGlobal("fetch", fetchMock);
    const { createPayment } = await load();
    const r = await createPayment({ merchantOrderId: "o1", amount: 499, redirectUrl: "https://site/done" });
    expect(r.checkoutUrl).toBe("https://pay/x");
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay");
    expect(init.headers.Authorization).toBe("O-Bearer tok");
    expect(JSON.parse(init.body)).toMatchObject({
      merchantOrderId: "o1",
      amount: 49900,
      expireAfter: 900,
      paymentFlow: { type: "PG_CHECKOUT", merchantUrls: { redirectUrl: "https://site/done" } },
    });
  });

  it("reuses the token until it expires", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) =>
      url.includes("oauth/token") ? tokenRes() : json({ redirectUrl: "https://pay/x" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { createPayment } = await load();
    const p = { merchantOrderId: "o1", amount: 1, redirectUrl: "https://site/done" };
    await createPayment(p);
    await createPayment(p);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("oauth/token"))).toHaveLength(1);
  });

  it("maps COMPLETED status and returns the transaction id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(tokenRes()).mockResolvedValueOnce(json({ state: "COMPLETED", paymentDetails: [{ transactionId: "t1" }] })),
    );
    const { getPaymentState } = await load();
    expect(await getPaymentState("o1")).toEqual({ state: "COMPLETED", transactionId: "t1" });
  });

  it("throws on non-2xx from create", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(tokenRes()).mockResolvedValueOnce(json({}, 400)));
    const { createPayment } = await load();
    await expect(createPayment({ merchantOrderId: "o1", amount: 1, redirectUrl: "https://s/d" })).rejects.toThrow();
  });

  it("accepts only the sha256 of username:password", async () => {
    const { isValidWebhookAuth } = await load();
    const good = createHash("sha256").update("user:pass").digest("hex");
    expect(isValidWebhookAuth(good)).toBe(true);
    expect(isValidWebhookAuth(null)).toBe(false);
    expect(isValidWebhookAuth(createHash("sha256").update("user:wrong").digest("hex"))).toBe(false);
  });
});
