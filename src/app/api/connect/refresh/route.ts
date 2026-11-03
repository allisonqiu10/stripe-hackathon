// OWNER: P1
import { ConnectStatusRequestSchema } from '../../../../lib/contract';
import { startOnboarding } from '../../../../lib/stripe/onboarding';
import { errorJson, toErrorResponse } from '../../../../lib/stripe/http';

export async function GET(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try {
    const q = new URL(_request.url).searchParams;
    const parsed = ConnectStatusRequestSchema.safeParse({ kind: q.get('kind'), id: q.get('id') });
    if (!parsed.success) return errorJson('kind (merchant|cause) and id are required', 400);
    const url = await startOnboarding(parsed.data.kind, parsed.data.id, false);
    return Response.redirect(url, 302);
  } catch (error) { return toErrorResponse(error, 'refresh'); }
}
