// OWNER: P2
import { beforeEach, expect, it, vi } from 'vitest';
import { intent, quote, succeededEvent, refundedEvent } from '../../../mocks/p2/fixtures';
const mock = vi.hoisted(() => ({ retrieve: vi.fn(), charge: vi.fn(), create: vi.fn(), list: vi.fn(), reverse: vi.fn(), metadata: vi.fn(), order: vi.fn(), orderUpdate: vi.fn(), upsert: vi.fn(), update: vi.fn() }));
vi.mock('../client', () => ({ stripe: { paymentIntents: { retrieve: mock.retrieve, update: mock.metadata }, charges: { retrieve: mock.charge }, transfers: { create: mock.create, list: mock.list, createReversal: mock.reverse } } }));
vi.mock('../../db', () => ({ db: { order: { findUnique: mock.order, update: mock.orderUpdate }, donation: { upsert: mock.upsert, update: mock.update } } }));
import { handlePaymentSucceeded, handleChargeRefunded } from './payment';
let donation: Record<string, unknown>;
let transfers: Array<Record<string, unknown>>;
beforeEach(() => {
  vi.resetAllMocks(); donation = {}; transfers = [];
  mock.retrieve.mockResolvedValue(intent);
  mock.order.mockResolvedValue({ ...quote, id: 'p2_test', paymentIntentId: intent.id, status: 'PENDING' });
  mock.charge.mockResolvedValue({ amount_refunded: 0, refunded: false });
  mock.upsert.mockImplementation(async () => donation);
  mock.update.mockImplementation(async ({ data }) => Object.assign(donation, data));
  mock.list.mockImplementation(() => (async function* () { yield* transfers; })());
  mock.create.mockImplementation(async params => { const transfer = { ...params, id: `tr_${params.metadata.leg}`, reversed: false }; transfers.push(transfer); return transfer; });
  mock.reverse.mockImplementation(async id => { transfers.find(t => t.id === id)!.reversed = true; });
});
it('serializes duplicate events and transfers only once per leg', async () => {
  await Promise.all([handlePaymentSucceeded(succeededEvent), handlePaymentSucceeded(succeededEvent)]);
  expect(mock.create).toHaveBeenCalledTimes(2);
  expect(donation.status).toBe('TRANSFERRED');
});
it('resumes after one transfer fails', async () => {
  const normal = mock.create.getMockImplementation()!;
  mock.create.mockImplementationOnce(normal).mockRejectedValueOnce({ code: 'balance_insufficient' });
  await expect(handlePaymentSucceeded(succeededEvent)).rejects.toBeDefined();
  expect(donation.status).toBe('FAILED');
  await handlePaymentSucceeded(succeededEvent);
  expect(transfers).toHaveLength(2);
  expect(donation.status).toBe('TRANSFERRED');
});
it('reconciles a transfer created before a database write failed', async () => {
  mock.update.mockRejectedValueOnce(new Error('database unavailable'));
  await expect(handlePaymentSucceeded(succeededEvent)).rejects.toThrow();
  await handlePaymentSucceeded(succeededEvent);
  expect(mock.create).toHaveBeenCalledTimes(2);
});
it('reverses a full refund once and does not repay on late success', async () => {
  await handlePaymentSucceeded(succeededEvent);
  mock.charge.mockResolvedValue({ amount_refunded: 500, refunded: true });
  await handleChargeRefunded(refundedEvent);
  await handleChargeRefunded(refundedEvent);
  await handlePaymentSucceeded(succeededEvent);
  expect(mock.reverse).toHaveBeenCalledTimes(2);
  expect(mock.create).toHaveBeenCalledTimes(2);
  expect(donation.status).toBe('REFUNDED');
});
it('does not transfer when refund arrives before success', async () => {
  mock.charge.mockResolvedValue({ amount_refunded: 500, refunded: true });
  await handleChargeRefunded(refundedEvent);
  expect(mock.create).not.toHaveBeenCalled();
  expect(donation.status).toBe('REFUNDED');
});
it('flags partial refunds without reversing entire transfers', async () => {
  mock.charge.mockResolvedValue({ amount_refunded: 100, refunded: false });
  await expect(handleChargeRefunded(refundedEvent)).rejects.toThrow('Partial refund');
  expect(mock.reverse).not.toHaveBeenCalled();
});
