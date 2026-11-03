// OWNER: P1
import type { Cause as DbCause, Merchant as DbMerchant } from "@prisma/client";
import type { Cause, Merchant } from "./contract";

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) };
  }
}

export function zodMessage(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ` : "") + i.message).join("; ");
}

export function serializeCause(c: DbCause): Cause {
  return {
    id: c.id, slug: c.slug, title: c.title, description: c.description, city: c.city,
    goalCents: c.goalCents, ownerName: c.ownerName, stripeAccountId: c.stripeAccountId ?? null,
    onboardingComplete: c.onboardingComplete, status: c.status,
  };
}

export function serializeMerchant(m: DbMerchant): Merchant {
  return {
    id: m.id, name: m.name, email: m.email, stripeAccountId: m.stripeAccountId ?? null,
    onboardingComplete: m.onboardingComplete, ruleType: m.ruleType, percentageBps: m.percentageBps,
    activeCauseId: m.activeCauseId ?? null,
  };
}

export function slugify(title: string): string {
  const s = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return s || "cause";
}
