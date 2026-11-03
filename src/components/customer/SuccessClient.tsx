// OWNER: P4
"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { USE_MOCKS, api } from "./api";
import { outcomeFromStatus, verifyPayment, type PaymentOutcome } from "./stripe";
import { clearCart } from "./cart";
import CauseProgressPanel from "./CauseProgressPanel";
import { useAsync } from "./hooks";
import { Card, ErrorNotice, LinkButton, Page, Spinner } from "./ui";

function Success({ merchantId, publishableKey }: { merchantId: string; publishableKey: string | undefined }) {
  const params = useSearchParams();
  const secret = params.get("payment_intent_client_secret");
  const mockStatus = params.get("redirect_status");

  // Verify the real PaymentIntent status; never trust URL params (mock mode excepted).
  const payment = useAsync(
    async (): Promise<PaymentOutcome> =>
      USE_MOCKS ? outcomeFromStatus(mockStatus ?? "") : verifyPayment(secret, publishableKey),
    [secret, mockStatus],
  );
  const status = payment.data;

  const cause = useAsync(async () => {
    const m = await api.getMerchant(merchantId);
    return m.activeCauseId ? api.getCauseById(m.activeCauseId) : null;
  }, [merchantId]);

  useEffect(() => {
    if (status === "succeeded") clearCart(merchantId);
  }, [status, merchantId]);

  if (payment.loading && !status) return <Page title="Confirming payment"><Spinner label="Confirming your payment…" /></Page>;

  if (status !== "succeeded" && status !== "processing") {
    const failed = status === "failed";
    return (
      <Page title={failed ? "Payment failed" : "We couldn't confirm your payment"}>
        <ErrorNotice
          message={
            failed
              ? "Your payment did not go through. Your cart is saved, so you can try again."
              : "We couldn't verify this payment. If you were charged, contact the shop; otherwise try again."
          }
          onRetry={payment.error ? payment.reload : undefined}
        />
        <div className="mt-4"><LinkButton href={`/shop/${merchantId}/checkout`}>Back to checkout</LinkButton></div>
      </Page>
    );
  }

  return (
    <Page title={status === "processing" ? "Payment processing" : "Thank you!"}>
      <Card className="mb-4">
        <p className="text-slate-800">
          {status === "processing"
            ? "Your payment is processing. We'll count your donation once it clears. Please don't pay again."
            : "Your payment went through and your donation is on its way."}
        </p>
      </Card>
      {cause.loading && !cause.data ? (
        <Spinner />
      ) : cause.data ? (
        <>
          <h2 className="mb-2 font-semibold text-slate-900">{cause.data.title}</h2>
          <p className="mb-2 text-xs text-slate-500">Progress updates within a few seconds of payment.</p>
          <CauseProgressPanel slug={cause.data.slug} />
        </>
      ) : cause.error ? (
        <ErrorNotice message={cause.error} onRetry={cause.reload} />
      ) : null}
      <div className="mt-6"><LinkButton href={`/shop/${merchantId}`}>Back to shop</LinkButton></div>
    </Page>
  );
}

export default function SuccessClient({ merchantId, publishableKey }: { merchantId: string; publishableKey: string | undefined }) {
  return (
    <Suspense fallback={<Page><Spinner /></Page>}>
      <Success merchantId={merchantId} publishableKey={publishableKey} />
    </Suspense>
  );
}
