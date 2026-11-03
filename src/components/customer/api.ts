// OWNER: P4
// Thin typed client for the contract endpoints. NEXT_PUBLIC_P4_MOCKS=1 uses src/mocks/p4/server.
import type {
  Cause,
  ConnectStatus,
  CreateCauseInput,
  IntentResponse,
  Merchant,
  Progress,
  Quote,
} from "@/mocks/p4/contract";

export const USE_MOCKS = process.env.NEXT_PUBLIC_P4_MOCKS === "1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const body = init?.body === undefined ? undefined : JSON.stringify(init.body);
  if (USE_MOCKS) {
    try {
      const { mockRequest } = await import("@/mocks/p4/server"); // not bundled unless mocks are on
      if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const out = (await mockRequest(path, { method: init?.method, body })) as T;
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
      headers: body ? { "Content-Type": "application/json" } : undefined,
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
  return data as T;
}

const post = <T>(path: string, body: unknown, signal?: AbortSignal) =>
  request<T>(path, { method: "POST", body, signal });

export const api = {
  listCauses: (q: { city?: string; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (q.city) sp.set("city", q.city);
    if (q.status) sp.set("status", q.status);
    const qs = sp.toString();
    return request<Cause[]>(`/api/causes${qs ? `?${qs}` : ""}`);
  },
  getCause: (slug: string) => request<Cause>(`/api/causes/${encodeURIComponent(slug)}`),
  getProgress: (slug: string) => request<Progress>(`/api/causes/${encodeURIComponent(slug)}/progress`),
  createCause: (input: CreateCauseInput) => post<Cause>("/api/causes", input),
  getMerchant: (id: string) => request<Merchant>(`/api/merchants/${encodeURIComponent(id)}`),
  quote: (b: { merchantId: string; itemAmountCents: number; roundUp: boolean }, signal?: AbortSignal) =>
    post<Quote>("/api/checkout/quote", b, signal),
  intent: (b: { merchantId: string; itemAmountCents: number; roundUp: boolean }) =>
    post<IntentResponse>("/api/checkout/intent", b),
  onboardCause: (causeId: string) => post<{ url: string }>("/api/connect/cause/onboard", { causeId }),
  causeStatus: (id: string) =>
    request<ConnectStatus>(`/api/connect/status?kind=cause&id=${encodeURIComponent(id)}`),

  /**
   * CONTRACT GAP (ask P1): no endpoint fetches a cause by id, but Merchant only has activeCauseId.
   * Workaround isolated here: list and match. Replace once P1 adds lookup-by-id.
   */
  getCauseById: async (id: string): Promise<Cause | null> =>
    (await request<Cause[]>("/api/causes")).find((c) => c.id === id) ?? null,
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
