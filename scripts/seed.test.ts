import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { expect, it } from 'vitest';

it('seeds balanced orders, repairs fake accounts, and preserves real onboarding on rerun', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'seed-test-'));
  const url = `file:${join(dir, 'test.db')}`;
  const env = { ...process.env, DATABASE_URL: url };
  const db = new PrismaClient({ datasources: { db: { url } } });
  const run = (file: string, args: string[]) => execFileSync(process.execPath, [file, ...args], { env, stdio: 'pipe' });
  try {
    run('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
    run('node_modules/tsx/dist/cli.mjs', ['scripts/seed.ts']);
    expect(await db.order.findUniqueOrThrow({ where: { id: 'seed-order-3' } })).toMatchObject({ itemAmountCents: 2500, totalCents: 2500, donationCents: 25 });
    expect(await db.merchant.findUniqueOrThrow({ where: { id: 'demo-roundup' } })).toMatchObject({ stripeAccountId: null, onboardingComplete: false });
    await db.merchant.update({ where: { id: 'demo-roundup' }, data: { stripeAccountId: 'acct_real_test', onboardingComplete: true } });
    await db.cause.update({ where: { id: 'seed-cause-1' }, data: { stripeAccountId: 'acct_seed_old', onboardingComplete: true } });
    run('node_modules/tsx/dist/cli.mjs', ['scripts/seed.ts']);
    expect(await db.merchant.findUniqueOrThrow({ where: { id: 'demo-roundup' } })).toMatchObject({ stripeAccountId: 'acct_real_test', onboardingComplete: true });
    expect(await db.cause.findUniqueOrThrow({ where: { id: 'seed-cause-1' } })).toMatchObject({ stripeAccountId: null, onboardingComplete: false });
    expect(await db.order.count()).toBe(3);
    expect(await db.donation.count()).toBe(3);
  } finally {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
