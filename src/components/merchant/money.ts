// OWNER: P3
// Display-only mirror of the MONEY RULES. The server is the source of truth.
import type { RuleType } from "./api";

export type Preview = {
  donationCents: number;
  totalCents: number;
  platformFeeCents: number;
  merchantKeepsCents: number;
  causeGetsCents: number;
};

export function previewDonation(opts: {
  ruleType: RuleType;
  itemAmountCents: number;
  percentageBps: number;
  roundUp: boolean;
  platformFeeBps?: number;
}): Preview {
  const { ruleType, itemAmountCents: item, percentageBps, roundUp, platformFeeBps = 0 } = opts;

  let donation = 0;
  if (ruleType === "ROUND_UP") {
    if (roundUp) donation = item % 100 === 0 ? 100 : 100 - (item % 100);
  } else {
    donation = Math.floor((item * percentageBps) / 10000);
  }

  const platformFee = Math.floor((donation * platformFeeBps) / 10000);
  const absorbed = ruleType === "PERCENTAGE" ? donation : 0;

  return {
    donationCents: donation,
    totalCents: ruleType === "ROUND_UP" ? item + donation : item,
    platformFeeCents: platformFee,
    merchantKeepsCents: item - absorbed,
    causeGetsCents: donation - platformFee,
  };
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
