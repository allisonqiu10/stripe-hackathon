// OWNER: P3
import { describe, expect, it } from "vitest";
import { formatUSD, previewDonation } from "./money";

const roundUp = (item: number, on = true) =>
  previewDonation({ ruleType: "ROUND_UP", itemAmountCents: item, percentageBps: 100, roundUp: on });
const pct = (item: number, bps: number, feeBps = 0) =>
  previewDonation({
    ruleType: "PERCENTAGE",
    itemAmountCents: item,
    percentageBps: bps,
    roundUp: false,
    platformFeeBps: feeBps,
  });

describe("ROUND_UP", () => {
  it("rounds up to the next whole dollar", () => {
    expect(roundUp(1250)).toMatchObject({ donationCents: 50, totalCents: 1300 });
    expect(roundUp(101).donationCents).toBe(99);
    expect(roundUp(199).donationCents).toBe(1);
  });
  it("donates 100 when the item is already whole dollars", () => {
    expect(roundUp(1000)).toMatchObject({ donationCents: 100, totalCents: 1100 });
  });
  it("donates nothing when the customer opts out", () => {
    expect(roundUp(1250, false)).toMatchObject({ donationCents: 0, totalCents: 1250 });
  });
  it("merchant keeps the full item amount", () => {
    expect(roundUp(1250).merchantKeepsCents).toBe(1250);
  });
});

describe("PERCENTAGE", () => {
  it("floors the donation and leaves total unchanged", () => {
    expect(pct(999, 100)).toMatchObject({ donationCents: 9, totalCents: 999 });
  });
  it("merchant absorbs the donation", () => {
    expect(pct(10000, 250)).toMatchObject({ donationCents: 250, merchantKeepsCents: 9750 });
  });
  it("handles 0 and 10000 bps", () => {
    expect(pct(1234, 0).donationCents).toBe(0);
    expect(pct(1234, 10000).donationCents).toBe(1234);
  });
});

describe("platform fee", () => {
  it("is floored and taken from the cause share", () => {
    expect(pct(10000, 100, 250)).toMatchObject({ donationCents: 100, platformFeeCents: 2, causeGetsCents: 98 });
  });
});

describe("formatUSD", () => {
  it("formats cents as dollars", () => {
    expect(formatUSD(48250)).toBe("$482.50");
  });
});
