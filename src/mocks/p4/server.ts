// OWNER: P4
// Fake backend for offline dev (NEXT_PUBLIC_P4_MOCKS=1). Mirrors the contract only.
import type { Cause, CauseProgressResponse as Progress, CheckoutIntentResponse as IntentResponse, ConnectStatusResponse as ConnectStatus, Merchant, Quote } from "@/lib/contract";

const cause: Cause = {
  id: "cause_1",
  slug: "riverside-community-garden",
  title: "Riverside Community Garden",
  description: "Raised beds and a tool shed for neighbors growing food together.",
  city: "Champaign, IL",
  goalCents: 250000,
  ownerName: "Riverside Garden Collective",
  stripeAccountId: "acct_mock",
  onboardingComplete: true,
  status: "ACTIVE",
};
const causes: Cause[] = [cause];
let raised = 42000;
let donors = 31;
const recent: Progress["recent"] = [
  { amountCents: 65, createdAt: new Date(Date.now() - 120000).toISOString() },
  { amountCents: 100, createdAt: new Date(Date.now() - 3600000).toISOString() },
];

const merchant = (id: string): Merchant => ({
  id,
  name: "Demo Café",
  email: "demo@example.com",
  stripeAccountId: "acct_mock_m",
  onboardingComplete: true,
  ruleType: id.includes("pct") ? "PERCENTAGE" : "ROUND_UP",
  percentageBps: 100,
  activeCauseId: cause.id,
});

function quote(body: { merchantId: string; itemAmountCents: number; roundUp: boolean }): Quote {
  const m = merchant(body.merchantId);
  const item = body.itemAmountCents;
  let donation = 0;
  if (m.ruleType === "ROUND_UP") {
    if (body.roundUp) donation = item % 100 === 0 ? 100 : 100 - (item % 100);
  } else donation = Math.floor((item * m.percentageBps) / 10000);
  return {
    merchantId: m.id,
    causeId: cause.id,
    itemAmountCents: item,
    donationCents: donation,
    totalCents: m.ruleType === "ROUND_UP" ? item + donation : item,
    ruleType: m.ruleType,
    roundUp: body.roundUp,
  };
}

export async function mockRequest(path: string, init?: { method?: string; body?: string }): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 200));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(init.body) : {};
  const url = new URL(path, "http://x");
  const p = url.pathname;
  let m: RegExpExecArray | null;

  if (p === "/api/causes" && method === "GET") return causes;
  if (p === "/api/causes" && method === "POST") {
    const c: Cause = {
      ...body,
      stripeAccountId: null,
      id: `cause_${causes.length + 1}`,
      slug: String(body.title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      onboardingComplete: false,
      status: "DRAFT",
    };
    causes.push(c);
    return c;
  }
  if ((m = /^\/api\/causes\/([^/]+)\/progress$/.exec(p)))
    return { raisedCents: raised, goalCents: cause.goalCents, donorCount: donors, recent } satisfies Progress;
  if ((m = /^\/api\/causes\/([^/]+)$/.exec(p))) {
    const c = causes.find((x) => x.slug === m![1]);
    if (!c) throw Object.assign(new Error("Cause not found"), { status: 404 });
    return c;
  }
  if ((m = /^\/api\/merchants\/([^/]+)$/.exec(p))) return merchant(m[1]);
  if (p === "/api/checkout/quote") return quote(body);
  if (p === "/api/checkout/intent") {
    const q = quote(body);
    raised += q.donationCents; // simulate the webhook landing
    if (q.donationCents) {
      donors += 1;
      recent.unshift({ amountCents: q.donationCents, createdAt: new Date().toISOString() });
    }
    return { clientSecret: "mock_secret", paymentIntentId: "pi_mock", quote: q } satisfies IntentResponse;
  }
  if (p === "/api/connect/cause/onboard") return { url: "/causes/riverside-community-garden/onboarding/complete" };
  if (p === "/api/connect/status") return { onboardingComplete: true, requirementsDue: [] } satisfies ConnectStatus;
  throw Object.assign(new Error(`No mock for ${method} ${p}`), { status: 404 });
}
