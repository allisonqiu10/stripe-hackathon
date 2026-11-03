// OWNER: P1
import { execSync } from 'node:child_process';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  const os = require('node:os'), fs = require('node:fs'), path = require('node:path');
  process.env.DATABASE_URL = `file:${path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'connect-test-')), 'test.db')}`;
  process.env.APP_URL = 'http://app.test';
  return { create: vi.fn(), retrieve: vi.fn(), link: vi.fn() };
});
vi.mock('./client', () => ({ stripe: { accounts: { create: m.create, retrieve: m.retrieve }, accountLinks: { create: m.link } } }));

import { db } from '../db';
import { createConnectedAccount, createOnboardingLink, getAccountStatus } from './connect';
import { handleAccountUpdated } from './handlers/account';
import { POST as causeOnboard } from '../../app/api/connect/cause/onboard/route';
import { POST as merchantOnboard } from '../../app/api/connect/merchant/onboard/route';
import { GET as status } from '../../app/api/connect/status/route';
import { GET as refresh } from '../../app/api/connect/refresh/route';

const ctx = { params: Promise.resolve({}) };
const done = (id: string) => ({ id, details_submitted: true, capabilities: { transfers: 'active' }, requirements: { currently_due: [], past_due: [] } });
const post = (body: unknown) => new Request('http://x/api', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const get = (qs: string) => new Request(`http://x/api?${qs}`);
const ev = (acct: unknown) => ({ type: 'account.updated', data: { object: acct } }) as never;

beforeAll(() => { execSync('npx prisma migrate deploy', { env: process.env, stdio: 'pipe' }); });
afterAll(() => db.$disconnect());
beforeEach(async () => {
  vi.resetAllMocks();
  await db.cause.deleteMany(); await db.merchant.deleteMany();
  await db.merchant.create({ data: { id: 'm1', name: 'Cafe', email: 'c@x.com' } });
  await db.cause.create({ data: { id: 'c1', slug: 'park', title: 'Park', description: 'd', city: 'SF', goalCents: 1000, ownerName: 'o' } });
  m.create.mockResolvedValue({ id: 'acct_1' });
  m.link.mockResolvedValue({ url: 'https://connect.stripe.com/setup/x' });
});

describe('connect lib', () => {
  it('creates account with approved controller config and idempotency key', async () => {
    await createConnectedAccount({ kind: 'cause', id: 'c1', name: 'Park', email: 'a@b.co' });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({
      country: 'US', email: 'a@b.co', capabilities: { transfers: { requested: true } }, business_profile: { name: 'Park' }, metadata: { kind: 'cause', id: 'c1' },
      controller: { stripe_dashboard: { type: 'express' }, fees: { payer: 'application' }, losses: { payments: 'application' }, requirement_collection: 'stripe' },
    }), { idempotencyKey: 'connect:account:cause:c1' });
  });
  it('creates onboarding link with refresh and return urls', async () => {
    expect(await createOnboardingLink('acct_1', '/x/done', { kind: 'merchant', id: 'm 1' })).toEqual({ url: 'https://connect.stripe.com/setup/x' });
    expect(m.link).toHaveBeenCalledWith({ account: 'acct_1', type: 'account_onboarding', refresh_url: 'http://app.test/api/connect/refresh?kind=merchant&id=m%201', return_url: 'http://app.test/x/done' });
  });
  it('status requires details, active transfers and nothing due', async () => {
    m.retrieve.mockResolvedValueOnce(done('a'));
    expect(await getAccountStatus('a')).toEqual({ onboardingComplete: true, requirementsDue: [] });
    m.retrieve.mockResolvedValueOnce({ ...done('a'), requirements: { currently_due: ['x'], past_due: ['x', 'y'] } });
    expect(await getAccountStatus('a')).toEqual({ onboardingComplete: false, requirementsDue: ['x', 'y'] });
    m.retrieve.mockResolvedValueOnce({ ...done('a'), capabilities: { transfers: 'inactive' } });
    expect((await getAccountStatus('a')).onboardingComplete).toBe(false);
  });
});

describe('account.updated handler', () => {
  it('completes merchant, activates DRAFT cause, idempotent; never reopens CLOSED; unknown no-op', async () => {
    await db.merchant.update({ where: { id: 'm1' }, data: { stripeAccountId: 'acct_m' } });
    await db.cause.update({ where: { id: 'c1' }, data: { stripeAccountId: 'acct_c' } });
    await handleAccountUpdated(ev(done('acct_m'))); await handleAccountUpdated(ev(done('acct_m')));
    await handleAccountUpdated(ev(done('acct_c'))); await handleAccountUpdated(ev(done('acct_c')));
    await handleAccountUpdated(ev(done('acct_unknown')));
    expect((await db.merchant.findUniqueOrThrow({ where: { id: 'm1' } })).onboardingComplete).toBe(true);
    expect(await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).toMatchObject({ onboardingComplete: true, status: 'ACTIVE' });
    await db.cause.update({ where: { id: 'c1' }, data: { status: 'CLOSED' } });
    await handleAccountUpdated(ev(done('acct_c')));
    expect((await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).status).toBe('CLOSED');
  });
  it('revokes readiness when a previously onboarded account loses transfers', async () => {
    await db.merchant.update({ where: { id: 'm1' }, data: { stripeAccountId: 'acct_m', onboardingComplete: true } });
    await db.cause.update({ where: { id: 'c1' }, data: { stripeAccountId: 'acct_c', onboardingComplete: true, status: 'ACTIVE' } });
    await handleAccountUpdated(ev({ ...done('acct_m'), capabilities: { transfers: 'inactive' } }));
    await handleAccountUpdated(ev({ ...done('acct_c'), requirements: { currently_due: ['a'], past_due: [] } }));
    expect((await db.merchant.findUniqueOrThrow({ where: { id: 'm1' } })).onboardingComplete).toBe(false);
    expect(await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).toMatchObject({ onboardingComplete: false, status: 'ACTIVE' });
  });
  it('does nothing while requirements outstanding', async () => {
    await db.cause.update({ where: { id: 'c1' }, data: { stripeAccountId: 'acct_c' } });
    await handleAccountUpdated(ev({ ...done('acct_c'), requirements: { currently_due: ['a'], past_due: [] } }));
    expect(await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).toMatchObject({ onboardingComplete: false, status: 'DRAFT' });
  });
});

describe('routes', () => {
  it('cause onboard creates+persists account once, returns link', async () => {
    const r = await causeOnboard(post({ causeId: 'c1' }), ctx);
    expect(await r.json()).toEqual({ url: 'https://connect.stripe.com/setup/x' });
    await causeOnboard(post({ causeId: 'c1' }), ctx);
    expect(m.create).toHaveBeenCalledTimes(1);
    expect((await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).stripeAccountId).toBe('acct_1');
    expect(m.link.mock.calls[1][0]).toMatchObject({ return_url: 'http://app.test/causes/park/onboarding/complete', refresh_url: 'http://app.test/api/connect/refresh?kind=cause&id=c1' });
  });
  it('merchant onboard passes email and merchant return path', async () => {
    await merchantOnboard(post({ merchantId: 'm1' }), ctx);
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'c@x.com' }), expect.anything());
    expect(m.link.mock.calls[0][0].return_url).toBe('http://app.test/merchant/onboarding/complete?merchantId=m1');
  });
  it('onboard errors: 404, 400, bad json, stripe failure without leaking', async () => {
    expect((await causeOnboard(post({ causeId: 'nope' }), ctx)).status).toBe(404);
    expect((await merchantOnboard(post({}), ctx)).status).toBe(400);
    expect((await merchantOnboard(post('{bad'), ctx)).status).toBe(400);
    m.create.mockRejectedValue(new Error('sk_test_SECRET boom'));
    const r = await merchantOnboard(post({ merchantId: 'm1' }), ctx);
    expect(r.status).toBe(502);
    expect(JSON.stringify(await r.json())).not.toContain('SECRET');
  });
  it('status: no account, incomplete, complete persists', async () => {
    expect(await (await status(get('kind=cause&id=c1'), ctx)).json()).toEqual({ onboardingComplete: false, requirementsDue: [] });
    await db.cause.update({ where: { id: 'c1' }, data: { stripeAccountId: 'acct_c' } });
    m.retrieve.mockResolvedValue({ ...done('acct_c'), requirements: { currently_due: ['a'], past_due: [] } });
    expect(await (await status(get('kind=cause&id=c1'), ctx)).json()).toEqual({ onboardingComplete: false, requirementsDue: ['a'] });
    m.retrieve.mockResolvedValue(done('acct_c'));
    expect(await (await status(get('kind=cause&id=c1'), ctx)).json()).toEqual({ onboardingComplete: true, requirementsDue: [] });
    expect(await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).toMatchObject({ onboardingComplete: true, status: 'ACTIVE' });
    m.retrieve.mockResolvedValue({ ...done('acct_c'), capabilities: { transfers: 'inactive' } });
    expect(await (await status(get('kind=cause&id=c1'), ctx)).json()).toMatchObject({ onboardingComplete: false });
    expect((await db.cause.findUniqueOrThrow({ where: { id: 'c1' } })).onboardingComplete).toBe(false);
    expect((await status(get('kind=x&id=c1'), ctx)).status).toBe(400);
    expect((await status(get('kind=merchant&id=zzz'), ctx)).status).toBe(404);
  });
  it('refresh redirects to fresh link; 400/404 otherwise', async () => {
    await db.merchant.update({ where: { id: 'm1' }, data: { stripeAccountId: 'acct_m' } });
    const r = await refresh(get('kind=merchant&id=m1'), ctx);
    expect(r.status).toBe(302);
    expect(r.headers.get('location')).toBe('https://connect.stripe.com/setup/x');
    expect((await refresh(get('kind=merchant'), ctx)).status).toBe(400);
    expect((await refresh(get('kind=cause&id=c1'), ctx)).status).toBe(404);
  });
});
