// OWNER: P1
import { db } from "../../../lib/db";
import { jsonError, readJson, serializeMerchant, zodMessage } from "../../../lib/api-helpers";
import { CreateMerchantRequestSchema } from "../../../lib/contract";

export async function POST(request: Request, _context: { params: Promise<Record<string, string>> }) {
  const raw = await readJson(request);
  if (!raw.ok) return raw.response;
  const parsed = CreateMerchantRequestSchema.safeParse(raw.body);
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const row = await db.merchant.create({ data: parsed.data });
  return Response.json(serializeMerchant(row), { status: 201 });
}
