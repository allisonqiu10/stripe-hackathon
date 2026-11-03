// OWNER: P4
import { loadStripe, type Stripe } from "@stripe/stripe-js";

export type PaymentOutcome = "succeeded" | "processing" | "failed" | "unknown";

let stripePromise: Promise<Stripe | null> | null = null;

/** Returns null when the publishable key is not configured. */
export function getStripe(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  return (stripePromise ??= loadStripe(key));
}

export function outcomeFromStatus(status: string): PaymentOutcome {
  if (status === "succeeded") return "succeeded";
  if (status === "processing") return "processing";
  if (status === "requires_payment_method" || status === "canceled") return "failed";
  return "unknown";
}

/** Verifies the real PaymentIntent status instead of trusting URL params. */
export async function verifyPayment(clientSecret: string | null): Promise<PaymentOutcome> {
  if (!clientSecret) return "unknown";
  const stripe = await getStripe();
  if (!stripe) return "unknown";
  const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret);
  if (error || !paymentIntent) return "unknown";
  return outcomeFromStatus(paymentIntent.status);
}
