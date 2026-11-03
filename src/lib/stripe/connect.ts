// OWNER: P1
import type Stripe from 'stripe';
import type { ConnectStatusResponse } from '../contract';
import { stripe } from './client';

export type ConnectKind = 'merchant' | 'cause';

const appUrl = () => (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export async function createConnectedAccount(input: { kind: ConnectKind; id: string; name: string; email?: string }): Promise<Stripe.Account> {
  return stripe.accounts.create({
    country: 'US',
    ...(input.email ? { email: input.email } : {}),
    controller: {
      stripe_dashboard: { type: 'express' },
      fees: { payer: 'application' },
      losses: { payments: 'application' },
      requirement_collection: 'stripe',
    },
    capabilities: { transfers: { requested: true } },
    business_profile: { name: input.name },
    metadata: { kind: input.kind, id: input.id },
  }, { idempotencyKey: `connect:account:${input.kind}:${input.id}` });
}

/** `target` builds the refresh_url; without it refresh falls back to the return path. */
export async function createOnboardingLink(accountId: string, returnPath: string, target?: { kind: ConnectKind; id: string }): Promise<{ url: string }> {
  const base = appUrl();
  const refresh = target
    ? `${base}/api/connect/refresh?kind=${encodeURIComponent(target.kind)}&id=${encodeURIComponent(target.id)}`
    : `${base}${returnPath}`;
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: refresh,
    return_url: `${base}${returnPath}`,
  });
  return { url: link.url };
}

export function statusFromAccount(account: Pick<Stripe.Account, 'details_submitted' | 'capabilities' | 'requirements'>): ConnectStatusResponse {
  const due = [...new Set([...(account.requirements?.currently_due ?? []), ...(account.requirements?.past_due ?? [])])];
  const onboardingComplete = account.details_submitted === true && account.capabilities?.transfers === 'active' && due.length === 0;
  return { onboardingComplete, requirementsDue: due };
}

export async function getAccountStatus(accountId: string): Promise<ConnectStatusResponse> {
  return statusFromAccount(await stripe.accounts.retrieve(accountId));
}
