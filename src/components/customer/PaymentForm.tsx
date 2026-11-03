// OWNER: P4
"use client";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState, type FormEvent } from "react";
import { USE_MOCKS } from "./api";
import { getStripe } from "./stripe";
import { Button, ErrorNotice } from "./ui";

function InnerForm({ returnUrl, payLabel }: { returnUrl: string; payLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
      });
      // Success redirects to return_url; immediate errors stay on the form.
      if (err) setError(err.message ?? "Payment failed. Please try again.");
    } catch {
      setError("Could not confirm payment. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error && <ErrorNotice message={error} />}
      <Button type="submit" disabled={!stripe || busy} className="w-full">
        {busy ? "Processing…" : payLabel}
      </Button>
    </form>
  );
}

export default function PaymentForm({
  clientSecret,
  publishableKey,
  returnUrl,
  payLabel,
}: {
  clientSecret: string;
  publishableKey: string | undefined;
  returnUrl: string;
  payLabel: string;
}) {
  if (USE_MOCKS) {
    return (
      <Button className="w-full" onClick={() => window.location.assign(`${returnUrl}?redirect_status=succeeded`)}>
        {payLabel} (mock)
      </Button>
    );
  }
  const stripe = getStripe(publishableKey);
  if (!stripe) {
    return <ErrorNotice message="Payments are not configured (missing STRIPE_PUBLISHABLE_KEY)." />;
  }
  return (
    <Elements key={clientSecret} stripe={stripe} options={{ clientSecret }}>
      <InnerForm returnUrl={returnUrl} payLabel={payLabel} />
    </Elements>
  );
}
