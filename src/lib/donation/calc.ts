// OWNER: P2
import type { CheckoutQuoteRequest, Merchant, Quote } from '../contract';

function cents(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 2147483647) throw new Error('Invalid cents');
  return value;
}
function bps(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 10000) throw new Error('Invalid basis points');
  return value;
}
export function computeQuote(merchant: Pick<Merchant, 'id' | 'ruleType' | 'percentageBps' | 'activeCauseId'>, request: CheckoutQuoteRequest): Quote {
  const item = cents(request.itemAmountCents);
  if (merchant.id !== request.merchantId || !merchant.activeCauseId) throw new Error('Invalid merchant or active cause');
  if (typeof request.roundUp !== 'boolean') throw new Error('Invalid roundUp');
  if (merchant.ruleType !== 'ROUND_UP' && merchant.ruleType !== 'PERCENTAGE') throw new Error('Invalid rule');
  const donationCents = merchant.ruleType === 'ROUND_UP'
    ? (request.roundUp ? 100 - item % 100 : 0)
    : Math.floor(item * bps(merchant.percentageBps) / 10000);
  return { ...request, causeId: merchant.activeCauseId, ruleType: merchant.ruleType, donationCents,
    totalCents: cents(item + (merchant.ruleType === 'ROUND_UP' ? donationCents : 0)) };
}
export function computeSplit(quote: Pick<Quote, 'itemAmountCents' | 'donationCents' | 'totalCents' | 'ruleType'>, platformFeeBps = 0) {
  const donation = cents(quote.donationCents);
  const platformFeeCents = Math.floor(donation * bps(platformFeeBps) / 10000);
  if (quote.ruleType !== 'ROUND_UP' && quote.ruleType !== 'PERCENTAGE') throw new Error('Invalid rule');
  const merchantCents = cents(cents(quote.itemAmountCents) - (quote.ruleType === 'PERCENTAGE' ? donation : 0));
  const causeCents = donation - platformFeeCents;
  if (merchantCents + causeCents + platformFeeCents !== cents(quote.totalCents)) throw new Error('Unbalanced split');
  return { merchantCents, causeCents, platformFeeCents };
}
