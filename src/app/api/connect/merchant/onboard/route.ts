// OWNER: P1
import { MerchantOnboardRequestSchema, type OnboardResponse } from '../../../../../lib/contract';
import { startOnboarding } from '../../../../../lib/stripe/onboarding';
import { errorJson, readJson, toErrorResponse } from '../../../../../lib/stripe/http';

export async function POST(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try {
    const parsed = MerchantOnboardRequestSchema.safeParse(await readJson(_request));
    if (!parsed.success) return errorJson('merchantId is required', 400);
    const url = await startOnboarding('merchant', parsed.data.merchantId, true);
    return Response.json({ url } satisfies OnboardResponse);
  } catch (error) { return toErrorResponse(error, 'merchant onboard'); }
}
