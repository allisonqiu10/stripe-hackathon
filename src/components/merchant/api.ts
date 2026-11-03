// OWNER: P3
// Single seam for types + transport. After P1 merges, change the import below to
// "@/lib/contract" and set USE_MOCKS to false; nothing else should need to change.
import { z } from "zod";
import {
  CauseSchema,
  ConnectStatusSchema,
  ImpactSchema,
  MerchantSchema,
  OnboardResponseSchema,
  ProgressSchema,
} from "@/mocks/p3/contract";
import type {
  Cause,
  ConnectStatus,
  Impact,
  Merchant,
  MerchantPatch,
  Progress,
  RuleType,
} from "@/mocks/p3/contract";
import { mockApi } from "@/mocks/p3/api";

export type { Cause, ConnectStatus, Impact, Merchant, MerchantPatch, Progress, RuleType };

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

async function request<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body as { error?: string } | null)?.error;
    throw new Error(msg ?? `Request failed (${res.status})`);
  }
  return schema.parse(body);
}

const enc = encodeURIComponent;

export function listMerchants(): Promise<Merchant[]> {
  // No list endpoint in the contract; real mode relies on typed/created ids.
  return USE_MOCKS ? mockApi.listMerchants() : Promise.resolve([]);
}

export function createMerchant(input: { name: string; email: string }): Promise<Merchant> {
  if (USE_MOCKS) return Promise.reject(new Error("Creating merchants is disabled in mock mode"));
  return request("/api/merchants", MerchantSchema, { method: "POST", body: JSON.stringify(input) });
}

export function getMerchant(id: string): Promise<Merchant> {
  return USE_MOCKS ? mockApi.getMerchant(id) : request(`/api/merchants/${enc(id)}`, MerchantSchema);
}

export function patchMerchant(id: string, patch: MerchantPatch): Promise<Merchant> {
  return USE_MOCKS
    ? mockApi.patchMerchant(id, patch)
    : request(`/api/merchants/${enc(id)}`, MerchantSchema, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
}

export function listCauses(city?: string): Promise<Cause[]> {
  if (USE_MOCKS) return mockApi.listCauses(city);
  const qs = new URLSearchParams({ status: "ACTIVE" });
  if (city) qs.set("city", city);
  return request(`/api/causes?${qs}`, z.array(CauseSchema));
}

export function getProgress(slug: string): Promise<Progress> {
  return USE_MOCKS
    ? mockApi.getProgress(slug)
    : request(`/api/causes/${enc(slug)}/progress`, ProgressSchema);
}

export function getImpact(merchantId: string): Promise<Impact> {
  return USE_MOCKS
    ? mockApi.getImpact(merchantId)
    : request(`/api/merchants/${enc(merchantId)}/impact`, ImpactSchema);
}

export function getConnectStatus(merchantId: string): Promise<ConnectStatus> {
  return USE_MOCKS
    ? mockApi.getConnectStatus(merchantId)
    : request(`/api/connect/status?kind=merchant&id=${enc(merchantId)}`, ConnectStatusSchema);
}

export function startMerchantOnboarding(merchantId: string): Promise<{ url: string }> {
  return USE_MOCKS
    ? mockApi.startMerchantOnboarding(merchantId)
    : request("/api/connect/merchant/onboard", OnboardResponseSchema, {
        method: "POST",
        body: JSON.stringify({ merchantId }),
      });
}
