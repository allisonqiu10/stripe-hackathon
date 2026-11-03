// OWNER: P1
import { db } from "../../../../lib/db";
import { jsonError, readJson, serializeMerchant, zodMessage } from "../../../../lib/api-helpers";
import { UpdateMerchantRequestSchema } from "../../../../lib/contract";

export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const { id } = await context.params;
  const row = await db.merchant.findUnique({ where: { id } });
  if (!row) return jsonError("Merchant not found", 404);
  return Response.json(serializeMerchant(row));
}

export async function PATCH(request: Request, context: { params: Promise<Record<string, string>> }) {
  const { id } = await context.params;
  const raw = await readJson(request);
  if (!raw.ok) return raw.response;
  const parsed = UpdateMerchantRequestSchema.safeParse(raw.body);
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { ruleType, percentageBps, activeCauseId } = parsed.data;
  if (ruleType === undefined && percentageBps === undefined && activeCauseId === undefined) return jsonError("No fields to update", 400);
  const existing = await db.merchant.findUnique({ where: { id } });
  if (!existing) return jsonError("Merchant not found", 404);
  if (activeCauseId) {
    const cause = await db.cause.findUnique({ where: { id: activeCauseId } });
    if (!cause) return jsonError("activeCauseId does not reference an existing cause", 400);
  }
  const row = await db.merchant.update({ where: { id }, data: { ruleType, percentageBps, activeCauseId } });
  return Response.json(serializeMerchant(row));
}
