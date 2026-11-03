// OWNER: P1
import { db } from "../../../../lib/db";
import { jsonError, serializeCause } from "../../../../lib/api-helpers";

// Path segment may be the cause slug OR the cause id.
export async function GET(_request: Request, context: { params: Promise<Record<string, string>> }) {
  const { slug } = await context.params;
  const row = await db.cause.findFirst({ where: { OR: [{ slug }, { id: slug }] } });
  if (!row) return jsonError("Cause not found", 404);
  return Response.json(serializeCause(row));
}
