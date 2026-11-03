// OWNER: P4
import { describe, expect, it } from "vitest";
import {
  formatCents,
  formatQuoteLine,
  parseDollarsToCents,
  progressPercent,
  timeAgo,
} from "./format";

describe("formatCents", () => {
  it("formats integer cents as dollars", () => {
    expect(formatCents(435)).toBe("$4.35");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123456)).toBe("$1,234.56");
  });
});

describe("formatQuoteLine", () => {
  it("renders item + donation -> total", () => {
    expect(
      formatQuoteLine({ itemAmountCents: 435, donationCents: 65, totalCents: 500 }),
    ).toBe("$4.35 + $0.65 → $5.00");
  });
});

describe("parseDollarsToCents", () => {
  it("parses valid dollar strings without float math", () => {
    expect(parseDollarsToCents("10")).toBe(1000);
    expect(parseDollarsToCents("10.5")).toBe(1050);
    expect(parseDollarsToCents("0.07")).toBe(7);
    expect(parseDollarsToCents(" 1,000.10 ")).toBe(100010);
  });
  it("rejects junk, negatives, zero and >2 decimals", () => {
    for (const bad of ["", "abc", "-5", "1.234", "0", "0.00", "1e3"]) {
      expect(parseDollarsToCents(bad)).toBeNull();
    }
  });
});

describe("progressPercent", () => {
  it("clamps to 0..100 and handles zero goal", () => {
    expect(progressPercent(50, 200)).toBe(25);
    expect(progressPercent(500, 200)).toBe(100);
    expect(progressPercent(10, 0)).toBe(0);
    expect(progressPercent(-5, 100)).toBe(0);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-01-01T12:00:00Z").getTime();
  it("buckets relative times", () => {
    expect(timeAgo("2026-01-01T11:59:50Z", now)).toBe("just now");
    expect(timeAgo("2026-01-01T11:55:00Z", now)).toBe("5m ago");
    expect(timeAgo("2026-01-01T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2025-12-30T12:00:00Z", now)).toBe("2d ago");
  });
  it("tolerates invalid dates", () => {
    expect(timeAgo("nope", now)).toBe("");
  });
});
