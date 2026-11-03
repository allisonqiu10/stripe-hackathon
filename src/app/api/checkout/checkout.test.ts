// OWNER: P2
import { beforeEach, expect, it, vi } from 'vitest';
import { quote } from '../../../mocks/p2/fixtures';
const mocks = vi.hoisted(() => ({ merchant: vi.fn(), order: vi.fn(), upsert: vi.fn(), create: vi.fn(), retrieve: vi.fn() }));
vi.mock('../../../lib/db', () => ({ db: { merchant: { findUnique: mocks.merchant }, order: { findUnique: mocks.order, upsert: mocks.upsert } } }));
vi.mock('../../../lib/stripe/client', () => ({ stripe: { paymentIntents: { create: mocks.create, retrieve: mocks.retrieve } } }));
import { POST as intent } from './intent/route';
import { POST as getQuote } from './quote/route';
const context = { params: Promise.resolve({}) };
const input = { merchantId: 'm', itemAmountCents: 435, roundUp: true };
const request = (body: unknown = input, key = 'purchase-1') => new Request('http://localhost/api/checkout/intent', { method: 'POST', body: JSON.stringify(body), headers: key ? { 'Idempotency-Key': key } : {} });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('PLATFORM_FEE_BPS', '0');
  mocks.merchant.mockResolvedValue({ id: 'm', ruleType: 'ROUND_UP', percentageBps: 100, activeCauseId: 'c', onboardingComplete: true, stripeAccountId: 'acct_m', activeCause: { id: 'c', status: 'ACTIVE', onboardingComplete: true, stripeAccountId: 'acct_c' } });
  mocks.order.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ id: 'pi_test', client_secret: 'test_secret', livemode: false });
});
it('recomputes totals and ignores supplied donation values', async () => {
  const response = await getQuote(request({ ...input, donationCents: 9000, totalCents: 1 }), context);
  expect(await response.json()).toEqual(quote);
});
it('requires a retry identity', async () => {
  expect((await intent(request(input, ''), context)).status).toBe(400);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('rejects incomplete onboarding', async () => {
  mocks.merchant.mockResolvedValue({ activeCause: { status: 'ACTIVE', onboardingComplete: false } });
  expect((await intent(request(), context)).status).toBe(409);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('creates a platform intent with immutable split metadata and a stable key', async () => {
  expect((await intent(request(), context)).status).toBe(200);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 500, currency: 'usd', metadata: expect.objectContaining({ merchantAccount: 'acct_m', causeAccount: 'acct_c', donationCents: '65' }) }), expect.objectContaining({ idempotencyKey: expect.stringContaining('p2:intent:p2_') }));
  expect(mocks.upsert).toHaveBeenCalled();
});
it('rejects conflicting reuse of a saved key', async () => {
  mocks.order.mockResolvedValue({ paymentIntentId: 'pi_test' });
  mocks.retrieve.mockResolvedValue({ metadata: { fingerprint: 'different' } });
  expect((await intent(request(), context)).status).toBe(409);
  expect(mocks.create).not.toHaveBeenCalled();
});
