// OWNER: P1
import { ConnectStatusRequestSchema, type ConnectStatusResponse } from '../../../../lib/contract';
import { db } from '../../../../lib/db';
import { stripe } from '../../../../lib/stripe/client';
import { statusFromAccount } from '../../../../lib/stripe/connect';
import { applyAccountStatus } from '../../../../lib/stripe/handlers/account';
import { errorJson, toErrorResponse, HttpError } from '../../../../lib/stripe/http';

export async function GET(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try {
    const q = new URL(_request.url).searchParams;
    const parsed = ConnectStatusRequestSchema.safeParse({ kind: q.get('kind'), id: q.get('id') });
    if (!parsed.success) return errorJson('kind (merchant|cause) and id are required', 400);
    const { kind, id } = parsed.data;
    const row = kind === 'merchant' ? await db.merchant.findUnique({ where: { id } }) : await db.cause.findUnique({ where: { id } });
    if (!row) throw new HttpError(404, kind === 'merchant' ? 'Merchant not found' : 'Cause not found');
    if (!row.stripeAccountId) return Response.json({ onboardingComplete: false, requirementsDue: [] } satisfies ConnectStatusResponse);
    const account = await stripe.accounts.retrieve(row.stripeAccountId);
    const status = statusFromAccount(account);
    await applyAccountStatus(account);
    return Response.json(status satisfies ConnectStatusResponse);
  } catch (error) { return toErrorResponse(error, 'status'); }
}
