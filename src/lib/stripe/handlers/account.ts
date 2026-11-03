// OWNER: P1
import type Stripe from "stripe";
import { db } from "../../db";
import { statusFromAccount } from "../connect";

/** Persists onboarding state for the Merchant/Cause owning this account. Idempotent; unknown accounts are a no-op. */
export async function applyAccountStatus(account: Pick<Stripe.Account, 'id' | 'details_submitted' | 'capabilities' | 'requirements'>): Promise<boolean> {
  const { onboardingComplete } = statusFromAccount(account);
  const merchant = await db.merchant.updateMany({ where: { stripeAccountId: account.id }, data: { onboardingComplete } });
  const cause = await db.cause.updateMany({ where: { stripeAccountId: account.id }, data: { onboardingComplete } });
  // Only DRAFT activates; CLOSED is never reopened.
  if (onboardingComplete) await db.cause.updateMany({ where: { stripeAccountId: account.id, status: 'DRAFT' }, data: { status: 'ACTIVE' } });
  return merchant.count + cause.count > 0;
}

export async function handleAccountUpdated(event: Stripe.Event): Promise<void> {
  await applyAccountStatus(event.data.object as Stripe.Account);
}
