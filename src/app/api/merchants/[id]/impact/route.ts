// OWNER: P1
import { db } from "../../../../../lib/db";
import { jsonError } from "../../../../../lib/api-helpers";

export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const { id } = await context.params;
  const merchant = await db.merchant.findUnique({ where: { id } });
  if (!merchant) return jsonError("Merchant not found", 404);
  const rows = await db.donation.findMany({
    where: { merchantId: id, status: "TRANSFERRED" },
    select: { orderId: true, causeId: true, amountCents: true, cause: { select: { title: true } } },
  });
  const orders = new Set<string>();
  const by = new Map<string, { causeId: string; title: string; amountCents: number }>();
  let total = 0;
  for (const r of rows) {
    total += r.amountCents;
    orders.add(r.orderId);
    const e = by.get(r.causeId) ?? { causeId: r.causeId, title: r.cause.title, amountCents: 0 };
    e.amountCents += r.amountCents;
    by.set(r.causeId, e);
  }
  return Response.json({
    totalDonatedCents: total,
    orderCount: orders.size,
    donationCount: rows.length,
    byCause: [...by.values()].sort((a, b) => b.amountCents - a.amountCents),
  });
}
