// OWNER: P1
import { db } from "../../../lib/db";
import { jsonError, readJson, serializeCause, slugify, zodMessage } from "../../../lib/api-helpers";
import { CreateCauseRequestSchema, ListCausesRequestSchema } from "../../../lib/contract";

export async function GET(request: Request, _context: { params: Promise<Record<string, string>> }) {
  const sp = new URL(request.url).searchParams;
  const parsed = ListCausesRequestSchema.safeParse({ city: sp.get("city") ?? undefined, status: sp.get("status") ?? undefined });
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { city, status } = parsed.data;
  // SQLite LIKE is case-insensitive for ASCII; filter city in JS for exact case-insensitive match.
  const rows = await db.cause.findMany({ where: status ? { status } : {}, orderBy: { title: "asc" } });
  const wanted = city?.trim().toLowerCase();
  return Response.json(rows.filter((r) => !wanted || r.city.toLowerCase() === wanted).map(serializeCause));
}

export async function POST(request: Request, _context: { params: Promise<Record<string, string>> }) {
  const raw = await readJson(request);
  if (!raw.ok) return raw.response;
  const parsed = CreateCauseRequestSchema.safeParse(raw.body);
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const base = slugify(parsed.data.title);
  for (let n = 1; n < 1000; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    try {
      const row = await db.cause.create({ data: { ...parsed.data, slug, status: "DRAFT" } });
      return Response.json(serializeCause(row), { status: 201 });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // retry only on unique collision
    }
  }
  return jsonError("Could not allocate slug", 500);
}
