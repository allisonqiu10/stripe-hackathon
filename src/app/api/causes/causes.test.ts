// OWNER: P1
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTables, setupTestDb } from "../../../lib/test-db";

type Db = Awaited<ReturnType<typeof setupTestDb>>;
let db: Db;
let list: typeof import("./route");
let one: typeof import("./[slug]/route");
let progress: typeof import("./[slug]/progress/route");
const ctx = (p: Record<string, string> = {}) => ({ params: Promise.resolve(p) });
const body = { title: "Park Fix!", description: "d", city: "Austin", goalCents: 1000, ownerName: "Bo" };
const post = (b: unknown) => new Request("http://x/api/causes", { method: "POST", body: JSON.stringify(b) });

beforeAll(async () => {
  db = await setupTestDb();
  list = await import("./route");
  one = await import("./[slug]/route");
  progress = await import("./[slug]/progress/route");
}, 60000);
beforeEach(() => clearTables(db));
afterAll(() => db?.$disconnect());

describe("causes", () => {
  it("creates DRAFT cause with slug and suffixes collisions", async () => {
    const r1 = await list.POST(post(body), ctx());
    expect(r1.status).toBe(201);
    const c1 = await r1.json();
    expect(c1).toMatchObject({ slug: "park-fix", status: "DRAFT", stripeAccountId: null, onboardingComplete: false });
    const c2 = await (await list.POST(post(body), ctx())).json();
    expect(c2.slug).toBe("park-fix-2");
  });
  it("rejects invalid body", async () => {
    expect((await list.POST(post({ title: "" }), ctx())).status).toBe(400);
    expect((await list.POST(new Request("http://x", { method: "POST", body: "nope" }), ctx())).status).toBe(400);
  });
  it("lists with filters", async () => {
    await db.cause.create({ data: { ...body, slug: "a", status: "ACTIVE" } });
    await db.cause.create({ data: { ...body, slug: "b", city: "Denver" } });
    const get = async (q: string) => list.GET(new Request("http://x/api/causes" + q), ctx());
    expect((await (await get("")).json()).length).toBe(2);
    expect((await (await get("?city=austin")).json()).map((c: { slug: string }) => c.slug)).toEqual(["a"]);
    expect((await (await get("?status=DRAFT")).json()).map((c: { slug: string }) => c.slug)).toEqual(["b"]);
    expect((await get("?status=BOGUS")).status).toBe(400);
  });
  it("gets by slug or id, 404 otherwise", async () => {
    const c = await db.cause.create({ data: { ...body, slug: "s1" } });
    expect((await (await one.GET(new Request("http://x"), ctx({ slug: "s1" }))).json()).id).toBe(c.id);
    expect((await (await one.GET(new Request("http://x"), ctx({ slug: c.id }))).json()).slug).toBe("s1");
    expect((await one.GET(new Request("http://x"), ctx({ slug: "nope" }))).status).toBe(404);
  });
  it("progress counts only TRANSFERRED", async () => {
    const c = await db.cause.create({ data: { ...body, slug: "p" } });
    const m = await db.merchant.create({ data: { name: "m", email: "m@x.com" } });
    const mk = async (i: number, amt: number, status: "TRANSFERRED" | "PENDING" | "REFUNDED") => {
      const o = await db.order.create({ data: { merchantId: m.id, causeId: c.id, paymentIntentId: `pi${i}`, itemAmountCents: 100, donationCents: amt, totalCents: 100 + amt, ruleType: "ROUND_UP" } });
      await db.donation.create({ data: { orderId: o.id, causeId: c.id, merchantId: m.id, paymentIntentId: `pi${i}`, kind: "ROUND_UP", amountCents: amt, platformFeeCents: 0, status, createdAt: new Date(2026, 0, i + 1) } });
    };
    for (let i = 0; i < 12; i++) await mk(i, 10, "TRANSFERRED");
    await mk(100, 999, "PENDING");
    await mk(101, 999, "REFUNDED");
    const res = await progress.GET(new Request("http://x"), ctx({ slug: c.id }));
    const j = await res.json();
    expect(j).toMatchObject({ raisedCents: 120, goalCents: 1000, donorCount: 12 });
    expect(j.recent.length).toBe(10);
    expect(j.recent[0].createdAt).toBe(new Date(2026, 0, 12).toISOString());
    expect((await progress.GET(new Request("http://x"), ctx({ slug: "zzz" }))).status).toBe(404);
  });
});
