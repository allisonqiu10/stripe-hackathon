// OWNER: P1
// Idempotent seed. Run: tsx scripts/seed.ts
// NOTE: stripeAccountId values below (acct_seed_*) are FAKE. They let the UI and
// progress/impact views work offline, but real Stripe test-mode payments need real
// Connect accounts created through the onboarding flow (/api/connect/*).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const causes = [
  { id: "seed-cause-1", slug: "community-garden", title: "Community Garden", description: "Raised beds and tools for a neighborhood garden.", city: "Austin", goalCents: 500000, ownerName: "Garden Collective", stripeAccountId: "acct_seed_cause1" },
  { id: "seed-cause-2", slug: "youth-soccer-fund", title: "Youth Soccer Fund", description: "Equipment and field fees for local youth teams.", city: "Austin", goalCents: 300000, ownerName: "Eastside Soccer", stripeAccountId: "acct_seed_cause2" },
  { id: "seed-cause-3", slug: "food-bank-van", title: "Food Bank Van", description: "A refrigerated van for weekly food deliveries.", city: "Denver", goalCents: 1200000, ownerName: "Mile High Pantry", stripeAccountId: "acct_seed_cause3" },
];

async function main() {
  for (const c of causes) {
    const data = { ...c, onboardingComplete: true, status: "ACTIVE" as const };
    await db.cause.upsert({ where: { id: c.id }, create: data, update: data });
  }
  const merchants = [
    { id: "demo-roundup", name: "Demo Round-Up Cafe", email: "roundup@example.com", ruleType: "ROUND_UP" as const, percentageBps: 100, activeCauseId: "seed-cause-1", stripeAccountId: "acct_seed_merchant1" },
    { id: "demo-percent", name: "Demo Percent Bakery", email: "percent@example.com", ruleType: "PERCENTAGE" as const, percentageBps: 100, activeCauseId: "seed-cause-2", stripeAccountId: "acct_seed_merchant2" },
  ];
  for (const m of merchants) {
    const data = { ...m, onboardingComplete: true };
    await db.merchant.upsert({ where: { id: m.id }, create: data, update: data });
  }
  const orders = [
    { n: 1, merchantId: "demo-roundup", causeId: "seed-cause-1", item: 435, don: 65, kind: "ROUND_UP" as const },
    { n: 2, merchantId: "demo-roundup", causeId: "seed-cause-1", item: 1210, don: 90, kind: "ROUND_UP" as const },
    { n: 3, merchantId: "demo-percent", causeId: "seed-cause-2", item: 2500, don: 25, kind: "PERCENTAGE" as const },
  ];
  for (const o of orders) {
    const id = `seed-order-${o.n}`;
    const pi = `pi_seed_${o.n}`;
    const order = { id, merchantId: o.merchantId, causeId: o.causeId, paymentIntentId: pi, itemAmountCents: o.item, donationCents: o.don, totalCents: o.item + o.don, ruleType: o.kind, status: "PAID" as const };
    await db.order.upsert({ where: { id }, create: order, update: order });
    const donation = { id: `seed-donation-${o.n}`, orderId: id, causeId: o.causeId, merchantId: o.merchantId, paymentIntentId: pi, kind: o.kind, amountCents: o.don, platformFeeCents: 0, status: "TRANSFERRED" as const };
    await db.donation.upsert({ where: { id: donation.id }, create: donation, update: donation });
  }
  console.log("Seeded causes:", causes.map((c) => `${c.id} (slug ${c.slug})`).join(", "));
  console.log("Seeded merchants:", merchants.map((m) => m.id).join(", "));
}

main().finally(() => db.$disconnect());
