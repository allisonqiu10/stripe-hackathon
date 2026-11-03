// OWNER: P4
import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type PaymentOutcome = "succeeded" | "processing" | "failed" | "unknown";

const cache = new Map<string, Promise<Stripe | null>>();

/**
 * The publishable key is passed down from a server page (STRIPE_PUBLISHABLE_KEY is not
 * exposed to the browser). Returns null when it is not configured.
 */
export function getStripe(publishableKey: string | undefined): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  let p = cache.get(publishableKey);
  if (!p) cache.set(publishableKey, (p = loadStripe(publishableKey)));
  return p;
}

export function outcomeFromStatus(status: string): PaymentOutcome {
  if (status === "succeeded") return "succeeded";
  if (status === "processing") return "processing";
  if (status === "requires_payment_method" || status === "canceled") return "failed";
  return "unknown";
}

/** Verifies the real PaymentIntent status instead of trusting URL params. */
export async function verifyPayment(clientSecret: string | null, publishableKey: string | undefined): Promise<PaymentOutcome> {
  if (!clientSecret) return "unknown";
  const stripe = await getStripe(publishableKey);
  if (!stripe) return "unknown";
  const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
  if (error || !paymentIntent) return "unknown";
  return outcomeFromStatus(paymentIntent.status);
}
