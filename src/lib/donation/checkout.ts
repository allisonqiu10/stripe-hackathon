// OWNER: P2
import { db } from '../db';
import { CheckoutQuoteRequestSchema, type CheckoutQuoteRequest } from '../contract';
import { computeQuote } from './calc';

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export async function readRequest(request: Request) {
  const json = await request.json().catch(() => { throw new CheckoutError('Invalid JSON'); });
  const parsed = CheckoutQuoteRequestSchema.safeParse(json);
  if (!parsed.success) throw new CheckoutError('Invalid checkout request');
  return parsed.data;
}
export async function prepareCheckout(input: CheckoutQuoteRequest) {
  const merchant = await db.merchant.findUnique({ where: { id: input.merchantId }, include: { activeCause: true } });
  if (!merchant) throw new CheckoutError('Merchant not found', 404);
  const cause = merchant.activeCause;
  if (!cause || cause.status !== 'ACTIVE') throw new CheckoutError('Merchant has no active cause', 409);
  if (!merchant.onboardingComplete || !cause.onboardingComplete || !merchant.stripeAccountId || !cause.stripeAccountId)
    throw new CheckoutError('Both accounts must complete onboarding', 409);
  return { quote: computeQuote(merchant, input), merchantAccount: merchant.stripeAccountId, causeAccount: cause.stripeAccountId };
}
export function checkoutError(error: unknown) {
  if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeIdempotencyError')
    return Response.json({ error: 'Checkout retry conflicts with the original purchase; reconcile it before using a new key' }, { status: 409 });
  return Response.json({ error: error instanceof CheckoutError ? error.message : 'Checkout unavailable' },
    { status: error instanceof CheckoutError ? error.status : 500 });
}
