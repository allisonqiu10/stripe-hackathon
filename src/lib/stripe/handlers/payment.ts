// OWNER: P2
import type Stripe from "stripe";
export async function handlePaymentSucceeded(_event: Stripe.Event): Promise<void> { throw new Error("NotImplemented"); }
export async function handleChargeRefunded(_event: Stripe.Event): Promise<void> { throw new Error("NotImplemented"); }
