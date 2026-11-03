// OWNER: P1
import { db } from "../../../../../lib/db";
import { jsonError } from "../../../../../lib/api-helpers";

export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const { slug } = await context.params;
  const cause = await db.cause.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!cause) return jsonError("Cause not found", 404);
  const where = { causeId: cause.id, status: "TRANSFERRED" as const };
  const [agg, recent] = await Promise.all([
    db.donation.aggregate({ where, _sum: { amountCents: true }, _count: { _all: true } }),
    db.donation.findMany({ where, orderBy: { createdAt: "desc" }, take: 10, select: { amountCents: true, createdAt: true } }),
  ]);
  return Response.json({
    raisedCents: agg._sum.amountCents ?? 0,
    goalCents: cause.goalCents,
    donorCount: agg._count._all,
    recent: recent.map((d) => ({ amountCents: d.amountCents, createdAt: d.createdAt.toISOString() })),
  });
}
