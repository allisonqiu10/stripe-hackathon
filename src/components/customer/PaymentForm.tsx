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
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    // Only reached on immediate error; success redirects to return_url.
    if (err) setError(err.message ?? "Payment failed. Please try again.");
    setBusy(false);
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
  returnUrl,
  payLabel,
}: {
  clientSecret: string;
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
  const stripe = getStripe();
  if (!stripe) {
    return <ErrorNotice message="Payments are not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)." />;
  }
  return (
    <Elements key={clientSecret} stripe={stripe} options={{ clientSecret }}>
      <InnerForm returnUrl={returnUrl} payLabel={payLabel} />
    </Elements>
  );
}
