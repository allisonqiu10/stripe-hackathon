// OWNER: P2
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), handler: vi.fn() }));
vi.mock('../../../../lib/stripe/client', () => ({ stripe: { webhooks: { constructEvent: mocks.verify } } }));
vi.mock('../../../../lib/stripe/handlers', () => ({ webhookHandlers: { 'payment_intent.succeeded': mocks.handler } }));
import { POST } from './route';
const context = { params: Promise.resolve({}) };
const request = () => new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body: '{ "raw": true }', headers: { 'stripe-signature': 'signature' } });
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_fixture'); });
it('verifies the exact raw body and acknowledges unknown events', async () => {
  mocks.verify.mockReturnValue({ type: 'unknown', livemode: false });
  expect((await POST(request(), context)).status).toBe(200);
  expect(mocks.verify).toHaveBeenCalledWith('{ "raw": true }', 'signature', 'whsec_fixture');
});
it('rejects invalid signatures', async () => {
  mocks.verify.mockImplementation(() => { throw new Error('invalid'); });
  expect((await POST(request(), context)).status).toBe(400);
  expect(mocks.handler).not.toHaveBeenCalled();
});
it('returns failure for retryable handler errors', async () => {
  mocks.verify.mockReturnValue({ type: 'payment_intent.succeeded', livemode: false });
  mocks.handler.mockRejectedValue(new Error('retry'));
  expect((await POST(request(), context)).status).toBe(500);
});
it('rejects live events', async () => {
  mocks.verify.mockReturnValue({ type: 'payment_intent.succeeded', livemode: true });
  expect((await POST(request(), context)).status).toBe(400);
  expect(mocks.handler).not.toHaveBeenCalled();
});
