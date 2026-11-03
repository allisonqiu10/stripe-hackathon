// OWNER: P4
import { describe, expect, it } from "vitest";
import { ITEMS, cartCount, setQty, subtotalCents } from "./cart";

describe("cart", () => {
  it("has 4-5 items with integer cent prices", () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(4);
    expect(ITEMS.length).toBeLessThanOrEqual(5);
    for (const i of ITEMS) expect(Number.isInteger(i.priceCents)).toBe(true);
  });

  it("sums subtotal in integer cents", () => {
    const [a, b] = ITEMS;
    const cart = setQty(setQty({}, a.id, 2), b.id, 1);
    expect(subtotalCents(cart)).toBe(a.priceCents * 2 + b.priceCents);
    expect(cartCount(cart)).toBe(3);
  });

  it("removes lines at qty <= 0 and ignores unknown ids", () => {
    const [a] = ITEMS;
    expect(setQty({ [a.id]: 1 }, a.id, 0)).toEqual({});
    expect(subtotalCents({ ghost: 5 })).toBe(0);
  });

  it("caps quantity", () => {
    expect(setQty({}, ITEMS[0].id, 999)[ITEMS[0].id]).toBe(20);
  });
});
