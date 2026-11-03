// OWNER: P1
import Stripe from 'stripe';
let instance: Stripe | undefined;
function getStripe(): Stripe {
  if (typeof window !== 'undefined') throw new Error('Stripe secret client is server-only');
  if (!instance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !/^(sk|rk)_test_/.test(key)) throw new Error('STRIPE_SECRET_KEY must be a test-mode key');
    instance = new Stripe(key, {apiVersion:'2026-10-28.endive',maxNetworkRetries:2});
  }
  return instance;
}
// Lazy access keeps build/import independent of credentials; all calls share one client.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    const client = getStripe();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
