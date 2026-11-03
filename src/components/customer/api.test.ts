// OWNER: P4
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, isSafeRedirect } from "./api";

afterEach(() => vi.unstubAllGlobals());

const stubFetch = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe("api response validation", () => {
  it("accepts a valid quote", async () => {
    const q = { merchantId: "m", itemAmountCents: 435, roundUp: true, causeId: "c", donationCents: 65, totalCents: 500, ruleType: "ROUND_UP" };
    stubFetch(200, q);
    expect(await api.quote({ merchantId: "m", itemAmountCents: 435, roundUp: true })).toEqual(q);
  });

  it("rejects a malformed quote with a 502 ApiError", async () => {
    stubFetch(200, { totalCents: "500" });
    await expect(api.quote({ merchantId: "m", itemAmountCents: 435, roundUp: true })).rejects.toMatchObject({ status: 502 });
  });

  it("surfaces the server error message", async () => {
    stubFetch(404, { error: "Cause not found" });
    const err = await api.getCause("x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Cause not found");
  });
});

describe("api.intent", () => {
  it("sends the Idempotency-Key header", async () => {
    const q = { merchantId: "m", itemAmountCents: 435, roundUp: true, causeId: "c", donationCents: 65, totalCents: 500, ruleType: "ROUND_UP" };
    const f = vi.fn(async () => new Response(JSON.stringify({ clientSecret: "s", paymentIntentId: "pi_1", quote: q }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await api.intent({ merchantId: "m", itemAmountCents: 435, roundUp: true }, "key-1");
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe("key-1");
  });
});

describe("isSafeRedirect", () => {
  it("only allows https stripe.com hosts", () => {
    expect(isSafeRedirect("https://connect.stripe.com/setup/e/x")).toBe(true);
    expect(isSafeRedirect("https://evil.com/?a=stripe.com")).toBe(false);
    expect(isSafeRedirect("http://connect.stripe.com/x")).toBe(false);
    expect(isSafeRedirect("//evil.com")).toBe(false);
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
  });
});
