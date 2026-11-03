// OWNER: P2
import type { CheckoutQuoteRequest, Merchant, Quote } from '../contract';
export function calculateQuote(_merchant: Pick<Merchant,'id'|'ruleType'|'percentageBps'|'activeCauseId'>, _request: CheckoutQuoteRequest): Quote { throw new Error('NotImplemented'); }
