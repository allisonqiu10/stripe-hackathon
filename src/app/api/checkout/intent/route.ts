// OWNER: P2
import { createHash } from 'node:crypto';
import { db } from '../../../../lib/db';
import { stripe } from '../../../../lib/stripe/client';
import { QuoteSchema } from '../../../../lib/contract';
import { computeSplit } from '../../../../lib/donation/calc';
import { CheckoutError, readRequest, prepareCheckout, checkoutError } from '../../../../lib/donation/checkout';

export async function POST(_request: Request, _context: { params: Promise<Record<string, string>> }) {
  try {
    const input = await readRequest(_request);
    const key = _request.headers.get('Idempotency-Key');
    if (!key || key.length > 200) throw new CheckoutError('Idempotency-Key header required (maximum 200 characters)');
    const orderId = 'p2_' + createHash('sha256').update(key).digest('hex');
    const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const existing = await db.order.findUnique({ where: { id: orderId } });
    if (existing) {
      const intent = await stripe.paymentIntents.retrieve(existing.paymentIntentId);
      if (intent.metadata.fingerprint !== fingerprint) throw new CheckoutError('Idempotency key reused with different input', 409);
      if (intent.livemode || !intent.client_secret) throw new Error('Invalid intent');
      return Response.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, quote: QuoteSchema.parse(JSON.parse(intent.metadata.quote)) });
    }
    const { quote, merchantAccount, causeAccount } = await prepareCheckout(input);
    if (quote.totalCents < 50 || quote.totalCents > 99999999) throw new CheckoutError('USD payment total must be between 50 and 99999999 cents');
    const split = computeSplit(quote, Number(process.env.PLATFORM_FEE_BPS ?? 0));
    // shortcut: Stripe retains creation keys for a limited time; reconcile orphan intents before retrying after 24 hours.
    const intent = await stripe.paymentIntents.create({ amount: quote.totalCents, currency: 'usd', payment_method_types: ['card'],
      transfer_group: orderId, metadata: { orderId, merchantId: quote.merchantId, causeId: quote.causeId, ruleType: quote.ruleType,
        donationCents: String(quote.donationCents), itemAmountCents: String(quote.itemAmountCents), fingerprint,
        quote: JSON.stringify(quote), merchantAccount, causeAccount, platformFeeCents: String(split.platformFeeCents) } },
      { idempotencyKey: `p2:intent:${orderId}` });
    if (intent.livemode || !intent.client_secret) throw new Error('Invalid intent');
    await db.order.upsert({ where: { id: orderId }, update: {}, create: { id: orderId, merchantId: quote.merchantId,
      causeId: quote.causeId, paymentIntentId: intent.id, itemAmountCents: quote.itemAmountCents,
      donationCents: quote.donationCents, totalCents: quote.totalCents, ruleType: quote.ruleType, status: 'PENDING' } });
    return Response.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, quote });
  } catch (error) { return checkoutError(error); }
}
