// OWNER: P4
// Thin typed client for the contract endpoints. NEXT_PUBLIC_P4_MOCKS=1 uses src/mocks/p4/server.
import type {
  CauseProgressResponse,
  Cause,
  CheckoutIntentResponse,
  ConnectStatusResponse,
  CreateCauseRequest,
  Merchant,
  OnboardResponse,
  Quote,
} from "../../lib/contract";
import {
  CauseProgressResponseSchema,
  CauseSchema,
  CheckoutIntentResponseSchema,
  ConnectStatusResponseSchema,
  MerchantSchema,
  OnboardResponseSchema,
  QuoteSchema,
} from "../../lib/contract";
import type { ZodType } from "zod";

export const USE_MOCKS = process.env.NEXT_PUBLIC_P4_MOCKS === "1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Init = { method?: string; body?: unknown; signal?: AbortSignal; headers?: Record<string, string> };

/** Fetch + validate against the contract schema so a drifting server can't crash the UI (or show bad money). */
async function request<T>(path: string, schema: ZodType<T>, init?: Init): Promise<T> {
  const raw = await rawRequest(path, init);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new ApiError("Unexpected response from server.", 502);
  return parsed.data;
}

async function rawRequest(path: string, init?: Init): Promise<unknown> {
  const body = init?.body === undefined ? undefined : JSON.stringify(init.body);
  if (USE_MOCKS) {
    try {
      const { mockRequest } = await import("@/mocks/p4/server"); // not bundled unless mocks are on
      if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const out = await mockRequest(path, { method: init?.method, body });
      if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      return out;
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.name === "AbortError") throw err;
      throw new ApiError(err.message, err.status ?? 500);
    }
  }
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      body,
      signal: init?.signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("Network error. Check your connection and try again.", 0);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error;
    throw new ApiError(msg ?? `Request failed (${res.status})`, res.status);
  }
  if (data === null) throw new ApiError("Unexpected empty response from server.", res.status);
  return data;
}

const post = <T>(path: string, schema: ZodType<T>, body: unknown, signal?: AbortSignal, headers?: Record<string, string>) =>
  request<T>(path, schema, { method: "POST", body, signal, headers });

export const api = {
  listCauses: (q: { city?: string; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (q.city) sp.set("city", q.city);
    if (q.status) sp.set("status", q.status);
    const qs = sp.toString();
    return request<Cause[]>(`/api/causes${qs ? `?${qs}` : ""}`, CauseSchema.array());
  },
  getCause: (slug: string) => request<Cause>(`/api/causes/${encodeURIComponent(slug)}`, CauseSchema),
  getProgress: (slug: string) => request<CauseProgressResponse>(`/api/causes/${encodeURIComponent(slug)}/progress`, CauseProgressResponseSchema),
  createCause: (input: CreateCauseRequest) => post<Cause>("/api/causes", CauseSchema, input),
  getMerchant: (id: string) => request<Merchant>(`/api/merchants/${encodeURIComponent(id)}`, MerchantSchema),
  quote: (b: { merchantId: string; itemAmountCents: number; roundUp: boolean }, signal?: AbortSignal) =>
    post<Quote>("/api/checkout/quote", QuoteSchema, b, signal),
  /** P2 requires an Idempotency-Key: same key + same input returns the same PaymentIntent. */
  intent: (b: { merchantId: string; itemAmountCents: number; roundUp: boolean }, idempotencyKey: string) =>
    post<CheckoutIntentResponse>("/api/checkout/intent", CheckoutIntentResponseSchema, b, undefined, {
      "Idempotency-Key": idempotencyKey,
    }),
  onboardCause: (causeId: string) => post<OnboardResponse>("/api/connect/cause/onboard", OnboardResponseSchema, { causeId }),
  causeStatus: (id: string) =>
    request<ConnectStatusResponse>(`/api/connect/status?kind=cause&id=${encodeURIComponent(id)}`, ConnectStatusResponseSchema),

  /**
   * CONTRACT GAP (ask P1): no endpoint fetches a cause by id, but Merchant only has activeCauseId.
   * Workaround isolated here: list and match. Replace once P1 adds lookup-by-id.
   */
  getCauseById: async (id: string): Promise<Cause | null> =>
    (await request<Cause[]>("/api/causes", CauseSchema.array())).find((c) => c.id === id) ?? null,
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

/** Only follow Stripe-hosted https onboarding links (or same-origin paths in mock mode). */
export function isSafeRedirect(url: string): boolean {
  if (USE_MOCKS && /^\/(?!\/)/.test(url)) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "stripe.com" || u.hostname.endsWith(".stripe.com"));
  } catch {
    return false;
  }
}
