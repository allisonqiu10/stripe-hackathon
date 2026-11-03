// OWNER: P1
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTables, setupTestDb } from "../../../lib/test-db";

let db: Awaited<ReturnType<typeof setupTestDb>>;
let coll: typeof import("./route");
let item: typeof import("./[id]/route");
let impact: typeof import("./[id]/impact/route");
const ctx = (p: Record<string, string> = {}) => ({ params: Promise.resolve(p) });
const req = (method: string, b?: unknown) => new Request("http://x", { method, body: b === undefined ? undefined : JSON.stringify(b) });
const cause = (slug: string, title = slug) => db.cause.create({ data: { slug, title, description: "d", city: "c", goalCents: 100, ownerName: "o" } });

beforeAll(async () => {
  db = await setupTestDb();
  coll = await import("./route");
  item = await import("./[id]/route");
  impact = await import("./[id]/impact/route");
}, 60000);
beforeEach(() => clearTables(db));
afterAll(() => db.$disconnect());

describe("merchants", () => {
  it("creates and gets", async () => {
    const r = await coll.POST(req("POST", { name: "Cafe", email: "a@b.com" }), ctx());
    expect(r.status).toBe(201);
    const m = await r.json();
    expect(m).toMatchObject({ name: "Cafe", ruleType: "ROUND_UP", percentageBps: 100, activeCauseId: null, stripeAccountId: null, onboardingComplete: false });
    expect((await (await item.GET(req("GET"), ctx({ id: m.id }))).json()).id).toBe(m.id);
    expect((await item.GET(req("GET"), ctx({ id: "no" }))).status).toBe(404);
    expect((await coll.POST(req("POST", { name: "x", email: "bad" }), ctx())).status).toBe(400);
  });
  it("patches", async () => {
    const m = await db.merchant.create({ data: { name: "m", email: "m@x.com" } });
    const c = await cause("c1");
    const patch = (b: unknown, id = m.id) => item.PATCH(req("PATCH", b), ctx({ id }));
    expect(await (await patch({ ruleType: "PERCENTAGE", percentageBps: 250, activeCauseId: c.id })).json()).toMatchObject({ ruleType: "PERCENTAGE", percentageBps: 250, activeCauseId: c.id });
    expect((await (await patch({ activeCauseId: null })).json()).activeCauseId).toBeNull();
    expect((await patch({})).status).toBe(400);
    expect((await patch({ activeCauseId: "missing" })).status).toBe(400);
    expect((await patch({ percentageBps: 20000 })).status).toBe(400);
    expect((await patch({ percentageBps: 5 }, "nope")).status).toBe(404);
  });
  it("impact counts only TRANSFERRED", async () => {
    const m = await db.merchant.create({ data: { name: "m", email: "m@x.com" } });
    const a = await cause("a", "Alpha");
    const b = await cause("b", "Beta");
    let i = 0;
    const mk = async (causeId: string, amt: number, status: "TRANSFERRED" | "PENDING", orderId?: string) => {
      i++;
      const oid = orderId ?? (await db.order.create({ data: { merchantId: m.id, causeId, paymentIntentId: `po${i}`, itemAmountCents: 1, donationCents: amt, totalCents: 1 + amt, ruleType: "ROUND_UP" } })).id;
      await db.donation.create({ data: { orderId: oid, causeId, merchantId: m.id, paymentIntentId: `pd${i}`, kind: "ROUND_UP", amountCents: amt, platformFeeCents: 0, status } });
      return oid;
    };
    const o1 = await mk(a.id, 50, "TRANSFERRED");
    await mk(a.id, 25, "TRANSFERRED", o1); // same order, second donation
    await mk(b.id, 10, "TRANSFERRED");
    await mk(b.id, 999, "PENDING");
    const j = await (await impact.GET(req("GET"), ctx({ id: m.id }))).json();
    expect(j).toMatchObject({ totalDonatedCents: 85, orderCount: 2, donationCount: 3 });
    expect(j.byCause).toEqual([{ causeId: a.id, title: "Alpha", amountCents: 75 }, { causeId: b.id, title: "Beta", amountCents: 10 }]);
    expect((await impact.GET(req("GET"), ctx({ id: "no" }))).status).toBe(404);
  });
});
