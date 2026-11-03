// OWNER: P1
import {afterEach,expect,it,vi} from 'vitest';
afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});
it('imports without credentials but rejects requests without a test key',async()=>{
  vi.stubEnv('STRIPE_SECRET_KEY','');
  const {stripe}=await import('../stripe/client');
  expect(()=>stripe.accounts).toThrow('test-mode key');
});
it('rejects live credentials',async()=>{
  vi.stubEnv('STRIPE_SECRET_KEY','sk_live_fixture');
  const {stripe}=await import('../stripe/client');
  expect(()=>stripe.accounts).toThrow('test-mode key');
});
it('shares a single configured client',async()=>{
  vi.stubEnv('STRIPE_SECRET_KEY','sk_test_fixture');
  const {stripe}=await import('../stripe/client');
  expect(stripe.accounts).toBe(stripe.accounts);
});
