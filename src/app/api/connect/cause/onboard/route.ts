// OWNER: P1
import { CauseOnboardRequestSchema, type OnboardResponse } from '../../../../../lib/contract';
import { startOnboarding } from '../../../../../lib/stripe/onboarding';
import { errorJson, readJson, toErrorResponse } from '../../../../../lib/stripe/http';

export async function POST(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try {
    const parsed = CauseOnboardRequestSchema.safeParse(await readJson(_request));
    if (!parsed.success) return errorJson('causeId is required', 400);
    const url = await startOnboarding('cause', parsed.data.causeId, true);
    return Response.json({ url } satisfies OnboardResponse);
  } catch (error) { return toErrorResponse(error, 'cause onboard'); }
}
