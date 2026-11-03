// OWNER: P2
import type Stripe from 'stripe';
import { stripe } from '../client';
import { db } from '../../db';
import { QuoteSchema } from '../../contract';

// shortcut: serializes one Node process only; use a durable per-order lock before running multiple workers.
const pending = new Map<string, Promise<void>>();
async function serialized(id: string, work: () => Promise<void>) {
  const previous = pending.get(id) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(work);
  pending.set(id, next);
  try { await next; } finally { if (pending.get(id) === next) pending.delete(id); }
}
async function settle(id: string) {
  const intent = await stripe.paymentIntents.retrieve(id);
  if (intent.livemode) throw new Error('Test mode only');
  if (!intent.metadata.orderId?.startsWith('p2_')) return;
  const order = await db.order.findUnique({ where: { paymentIntentId: id } });
  if (!order) throw new Error('Order not yet persisted');
  const quote = QuoteSchema.parse(JSON.parse(intent.metadata.quote));
  if (order.id !== intent.metadata.orderId || order.merchantId !== quote.merchantId || order.causeId !== quote.causeId ||
    order.itemAmountCents !== quote.itemAmountCents || order.donationCents !== quote.donationCents ||
    order.totalCents !== quote.totalCents || order.ruleType !== quote.ruleType || intent.amount !== order.totalCents || intent.currency !== 'usd')
    throw new Error('Payment snapshot mismatch');
  if (intent.status !== 'succeeded') throw new Error('Payment not succeeded');
  const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
  if (!chargeId) throw new Error('Missing charge');
  const fee = Number(intent.metadata.platformFeeCents);
  if (!Number.isInteger(fee) || fee < 0 || fee > quote.donationCents) throw new Error('Invalid fee snapshot');
  const merchantAmount = quote.itemAmountCents - (quote.ruleType === 'PERCENTAGE' ? quote.donationCents : 0);
  const causeAmount = quote.donationCents - fee;
  if (merchantAmount < 0 || merchantAmount + causeAmount + fee !== quote.totalCents) throw new Error('Invalid split');
  const donation = await db.donation.upsert({ where: { paymentIntentId: id }, update: {}, create: {
    paymentIntentId: id, orderId: order.id, merchantId: quote.merchantId, causeId: quote.causeId,
    kind: quote.ruleType, amountCents: quote.donationCents, platformFeeCents: fee, status: 'PENDING' } });
  try {
    let charge = await stripe.charges.retrieve(chargeId);
    if (charge.amount_refunded > 0 && !charge.refunded) throw new Error('Partial refund requires manual reconciliation');
    if (!charge.refunded && order.status !== 'REFUNDED') {
      await db.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
      for (const [leg, amount, destination] of [
        ['merchant', merchantAmount, intent.metadata.merchantAccount],
        ['cause', causeAmount, intent.metadata.causeAccount],
      ] as const) {
        if (amount === 0) continue;
        if (!destination?.startsWith('acct_')) throw new Error('Missing destination snapshot');
        const field = leg === 'merchant' ? 'merchantTransferId' : 'causeTransferId';
        if (donation[field]) continue;
        let transfer: Stripe.Transfer | undefined;
        for await (const candidate of stripe.transfers.list({ transfer_group: order.id, limit: 100 })) {
          if (candidate.metadata.leg === leg) { transfer = candidate; break; }
        }
        if (!transfer) {
          charge = await stripe.charges.retrieve(chargeId);
          if (charge.amount_refunded > 0) break;
          transfer = await stripe.transfers.create({ amount, currency: 'usd', destination, source_transaction: chargeId,
            transfer_group: order.id, metadata: { orderId: order.id, leg } }, { idempotencyKey: `p2:transfer:${id}:${leg}` });
        }
        if (transfer.amount !== amount || transfer.destination !== destination || transfer.source_transaction !== chargeId || transfer.currency !== 'usd') throw new Error('Transfer mismatch');
        await db.donation.update({ where: { paymentIntentId: id }, data: { [field]: transfer.id } });
      }
    }
    charge = await stripe.charges.retrieve(chargeId);
    if (charge.amount_refunded > 0 && !charge.refunded) throw new Error('Partial refund requires manual reconciliation');
    if (charge.refunded || order.status === 'REFUNDED') {
      await db.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
      for await (const transfer of stripe.transfers.list({ transfer_group: order.id, limit: 100 })) {
        if (transfer.metadata.orderId !== order.id) continue;
        if (!transfer.reversed) await stripe.transfers.createReversal(transfer.id, {}, { idempotencyKey: `p2:reverse:${transfer.id}` });
      }
      await db.donation.update({ where: { paymentIntentId: id }, data: { status: 'REFUNDED' } });
    } else {
      await db.donation.update({ where: { paymentIntentId: id }, data: { status: 'TRANSFERRED' } });
    }
  } catch (error) {
    await db.donation.update({ where: { paymentIntentId: id }, data: { status: 'FAILED' } });
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'reconciliation_required';
    // Store only a bounded error code, never raw Stripe request/response data.
    await stripe.paymentIntents.update(id, { metadata: { p2Error: code.slice(0, 100) } },
      { idempotencyKey: `p2:error:${id}:${code.slice(0, 100)}` });
    throw error;
  }
}
export async function handlePaymentSucceeded(_event: Stripe.Event): Promise<void> {
  if (_event.livemode) throw new Error('Test mode only');
  const intent = _event.data.object as Stripe.PaymentIntent;
  await serialized(intent.id, () => settle(intent.id));
}
export async function handleChargeRefunded(_event: Stripe.Event): Promise<void> {
  if (_event.livemode) throw new Error('Test mode only');
  const charge = _event.data.object as Stripe.Charge;
  const id = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (id) await serialized(id, () => settle(id));
}
