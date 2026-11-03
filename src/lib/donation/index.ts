// OWNER: P2
import type { CheckoutQuoteRequest, Merchant, Quote } from '../contract';
import { computeQuote } from './calc';
export function calculateQuote(_merchant: Pick<Merchant,'id'|'ruleType'|'percentageBps'|'activeCauseId'>, _request: CheckoutQuoteRequest): Quote { return computeQuote(_merchant, _request); }
