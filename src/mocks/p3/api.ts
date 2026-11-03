// OWNER: P3
// In-memory stand-ins for the P1 routes, used when USE_MOCKS is on.
import type { Cause, ConnectStatus, Impact, Merchant, MerchantPatch, Progress } from "./contract";
import {
  causes,
  connectStatusByMerchant,
  impactByMerchant,
  merchants,
  progressBySlug,
} from "./fixtures";

const delay = <T>(value: T, ms = 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

const db = {
  merchants: merchants.map((m) => ({ ...m })),
  statuses: { ...connectStatusByMerchant },
};

function findMerchant(id: string): Merchant {
  const m = db.merchants.find((x) => x.id === id);
  if (!m) throw new Error("Merchant not found");
  return m;
}

export const mockApi = {
  listMerchants: () => delay(db.merchants.map((m) => ({ ...m }))),
  getMerchant: (id: string) => delay({ ...findMerchant(id) }),
  patchMerchant: (id: string, patch: MerchantPatch) => {
    const m = findMerchant(id);
    if (patch.percentageBps !== undefined && (patch.percentageBps < 0 || patch.percentageBps > 10000)) {
      return Promise.reject(new Error("percentageBps must be between 0 and 10000"));
    }
    Object.assign(m, patch);
    return delay({ ...m });
  },
  listCauses: (city?: string): Promise<Cause[]> =>
    delay(
      causes.filter(
        (c) => c.status === "ACTIVE" && (!city || c.city.toLowerCase() === city.toLowerCase()),
      ),
    ),
  getProgress: (slug: string): Promise<Progress> => {
    const p = progressBySlug[slug];
    return p ? delay(p) : Promise.reject(new Error("Cause not found"));
  },
  getImpact: (id: string): Promise<Impact> => {
    findMerchant(id);
    return delay(impactByMerchant[id]);
  },
  getConnectStatus: (id: string): Promise<ConnectStatus> => {
    findMerchant(id);
    return delay(db.statuses[id] ?? { onboardingComplete: false, requirementsDue: [] });
  },
  startMerchantOnboarding: (id: string): Promise<{ url: string }> => {
    findMerchant(id);
    // Pretend Stripe finished: flip the mock state and bounce to the return page.
    db.statuses[id] = { onboardingComplete: true, requirementsDue: [] };
    findMerchant(id).onboardingComplete = true;
    return delay({ url: `/merchant/onboarding/complete?merchantId=${encodeURIComponent(id)}` });
  },
};
