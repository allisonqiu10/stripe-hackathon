// OWNER: P4
import { describe, expect, it } from "vitest";
import { getStripe, outcomeFromStatus, verifyPayment } from "./stripe";

describe("outcomeFromStatus", () => {
  it("maps PaymentIntent statuses", () => {
    expect(outcomeFromStatus("succeeded")).toBe("succeeded");
    expect(outcomeFromStatus("processing")).toBe("processing");
    expect(outcomeFromStatus("requires_payment_method")).toBe("failed");
    expect(outcomeFromStatus("requires_action")).toBe("unknown");
  });
});

describe("verifyPayment", () => {
  it("is unknown without a client secret", async () => {
    expect(await verifyPayment(null, "pk_test_x")).toBe("unknown");
  });
  it("is unknown without a publishable key", async () => {
    expect(await verifyPayment("pi_secret_x", undefined)).toBe("unknown");
  });
});

describe("getStripe", () => {
  it("returns null when no key is configured", () => {
    expect(getStripe(undefined)).toBeNull();
    expect(getStripe("")).toBeNull();
  });
});
