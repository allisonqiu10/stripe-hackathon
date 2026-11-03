// OWNER: P2
import type Stripe from 'stripe';
export const quote = { merchantId: 'm', causeId: 'c', itemAmountCents: 435, donationCents: 65, totalCents: 500, ruleType: 'ROUND_UP', roundUp: true };
export const intent = { id: 'pi_test', livemode: false, status: 'succeeded', amount: 500, currency: 'usd', latest_charge: 'ch_test', metadata: {
  orderId: 'p2_test', quote: JSON.stringify(quote), platformFeeCents: '0', merchantAccount: 'acct_m', causeAccount: 'acct_c',
} };
export const succeededEvent = { id: 'evt_success', type: 'payment_intent.succeeded', livemode: false, data: { object: intent } } as unknown as Stripe.Event;
export const refundedEvent = { id: 'evt_refund', type: 'charge.refunded', livemode: false, data: { object: { id: 'ch_test', payment_intent: intent.id } } } as unknown as Stripe.Event;
