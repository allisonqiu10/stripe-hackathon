// OWNER: P1
// Idempotent seed. Run: tsx scripts/seed.ts
// Demo progress is synthetic. Complete real Stripe test onboarding before checkout.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const causes = [
  { id: "seed-cause-1", slug: "community-garden", title: "Community Garden", description: "Raised beds and tools for a neighborhood garden.", city: "Austin", goalCents: 500000, ownerName: "Garden Collective" },
  { id: "seed-cause-2", slug: "youth-soccer-fund", title: "Youth Soccer Fund", description: "Equipment and field fees for local youth teams.", city: "Austin", goalCents: 300000, ownerName: "Eastside Soccer" },
  { id: "seed-cause-3", slug: "food-bank-van", title: "Food Bank Van", description: "A refrigerated van for weekly food deliveries.", city: "Denver", goalCents: 1200000, ownerName: "Mile High Pantry" },
];

async function main() {
  for (const c of causes) {
    const data = { ...c, onboardingComplete: false, status: "ACTIVE" as const };
    await db.cause.upsert({ where: { id: c.id }, create: data, update: {} });
  }
  const merchants = [
    { id: "demo-roundup", name: "Demo Round-Up Cafe", email: "roundup@example.com", ruleType: "ROUND_UP" as const, percentageBps: 100, activeCauseId: "seed-cause-1" },
    { id: "demo-percent", name: "Demo Percent Bakery", email: "percent@example.com", ruleType: "PERCENTAGE" as const, percentageBps: 100, activeCauseId: "seed-cause-2" },
  ];
  for (const m of merchants) {
    const data = { ...m, onboardingComplete: false };
    await db.merchant.upsert({ where: { id: m.id }, create: data, update: {} });
  }
  // Repair legacy demo accounts without overwriting real onboarding on subsequent runs.
  await db.cause.updateMany({ where: { id: { in: causes.map(c => c.id) }, stripeAccountId: { startsWith: "acct_seed_" } }, data: { stripeAccountId: null, onboardingComplete: false } });
  await db.merchant.updateMany({ where: { id: { in: merchants.map(m => m.id) }, stripeAccountId: { startsWith: "acct_seed_" } }, data: { stripeAccountId: null, onboardingComplete: false } });
  const orders = [
    { n: 1, merchantId: "demo-roundup", causeId: "seed-cause-1", item: 435, don: 65, kind: "ROUND_UP" as const },
    { n: 2, merchantId: "demo-roundup", causeId: "seed-cause-1", item: 1210, don: 90, kind: "ROUND_UP" as const },
    { n: 3, merchantId: "demo-percent", causeId: "seed-cause-2", item: 2500, don: 25, kind: "PERCENTAGE" as const },
  ];
  for (const o of orders) {
    const id = `seed-order-${o.n}`;
    const pi = `pi_seed_${o.n}`;
    const order = { id, merchantId: o.merchantId, causeId: o.causeId, paymentIntentId: pi, itemAmountCents: o.item, donationCents: o.don, totalCents: o.item + (o.kind === "ROUND_UP" ? o.don : 0), ruleType: o.kind, status: "PAID" as const };
    await db.order.upsert({ where: { id }, create: order, update: order });
    const donation = { id: `seed-donation-${o.n}`, orderId: id, causeId: o.causeId, merchantId: o.merchantId, paymentIntentId: pi, kind: o.kind, amountCents: o.don, platformFeeCents: 0, status: "TRANSFERRED" as const };
    await db.donation.upsert({ where: { id: donation.id }, create: donation, update: donation });
  }
  console.log("Seeded causes:", causes.map((c) => `${c.id} (slug ${c.slug})`).join(", "));
  console.log("Seeded merchants:", merchants.map((m) => m.id).join(", "));
}

main().finally(() => db.$disconnect());
