// OWNER: P4
import { describe, expect, it } from "vitest";
import { outcomeFromStatus, verifyPayment } from "./stripe";

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
    expect(await verifyPayment(null)).toBe("unknown");
  });
});
