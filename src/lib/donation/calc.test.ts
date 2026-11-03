// OWNER: P2
import { describe, expect, it } from 'vitest';
import { computeQuote, computeSplit } from './calc';
const merchant = { id: 'm', activeCauseId: 'c', ruleType: 'ROUND_UP' as const, percentageBps: 100 };
const request = (itemAmountCents: number, roundUp = true) => ({ merchantId: 'm', itemAmountCents, roundUp });
describe('money calculations', () => {
  it.each([[435,65],[400,100],[0,100],[499,1]])('rounds %i by %i', (item, donation) => {
    expect(computeQuote(merchant, request(item)).donationCents).toBe(donation);
  });
  it('honors opt out', () => expect(computeQuote(merchant, request(435, false)).totalCents).toBe(435));
  it('floors percentage and fee independently', () => {
    const quote = computeQuote({ ...merchant, ruleType: 'PERCENTAGE', percentageBps: 333 }, request(435));
    expect(quote.donationCents).toBe(14);
    expect(quote.totalCents).toBe(435);
    expect(computeSplit(quote, 999)).toEqual({ merchantCents: 421, causeCents: 13, platformFeeCents: 1 });
  });
  it('conserves every cent across rules, fees and boundary amounts', () => {
    for (const ruleType of ['ROUND_UP', 'PERCENTAGE'] as const)
      for (const item of [0,1,99,100,435,99999,1000000])
        for (const percentageBps of [0,1,333,10000])
          for (const fee of [0,1,333,10000])
            for (const optIn of [false,true]) {
              const quote = computeQuote({ ...merchant, ruleType, percentageBps }, request(item,optIn));
              const split = computeSplit(quote, fee);
              expect(split.merchantCents + split.causeCents + split.platformFeeCents).toBe(quote.totalCents);
              expect(Object.values(split).every(n => Number.isInteger(n) && n >= 0)).toBe(true);
            }
  });
  it.each([-1, 0.1, NaN, Infinity, 2147483648])('rejects invalid cents %s', item => expect(() => computeQuote(merchant, request(item))).toThrow());
  it('rejects invalid fees and overflowing totals', () => {
    expect(() => computeSplit(computeQuote(merchant, request(435)), 10001)).toThrow();
    expect(() => computeQuote(merchant, request(2147483647))).toThrow();
  });
});
