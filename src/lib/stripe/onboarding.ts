// OWNER: P1
import { db } from '../db';
import { createConnectedAccount, createOnboardingLink, type ConnectKind } from './connect';
import { HttpError } from './http';

async function load(kind: ConnectKind, id: string) {
  if (kind === 'merchant') {
    const m = await db.merchant.findUnique({ where: { id } });
    return m && { name: m.name, email: m.email, stripeAccountId: m.stripeAccountId, returnPath: `/merchant/onboarding/complete?merchantId=${m.id}` };
  }
  const c = await db.cause.findUnique({ where: { id } });
  return c && { name: c.title, email: undefined, stripeAccountId: c.stripeAccountId, returnPath: `/causes/${c.slug}/onboarding/complete` };
}

async function persistAccountId(kind: ConnectKind, id: string, accountId: string): Promise<string> {
  if (kind === 'merchant') await db.merchant.updateMany({ where: { id, stripeAccountId: null }, data: { stripeAccountId: accountId } });
  else await db.cause.updateMany({ where: { id, stripeAccountId: null }, data: { stripeAccountId: accountId } });
  const row = kind === 'merchant' ? await db.merchant.findUnique({ where: { id } }) : await db.cause.findUnique({ where: { id } });
  return row?.stripeAccountId ?? accountId;
}

/** Ensures a connected account exists (creating when `create`), then returns a fresh onboarding link URL. */
export async function startOnboarding(kind: ConnectKind, id: string, create: boolean): Promise<string> {
  const row = await load(kind, id);
  if (!row) throw new HttpError(404, kind === 'merchant' ? 'Merchant not found' : 'Cause not found');
  let accountId = row.stripeAccountId;
  if (!accountId) {
    if (!create) throw new HttpError(404, 'No connected account yet');
    const account = await createConnectedAccount({ kind, id, name: row.name, email: row.email });
    accountId = await persistAccountId(kind, id, account.id);
  }
  return (await createOnboardingLink(accountId, row.returnPath, { kind, id })).url;
}
