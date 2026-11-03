// OWNER: P4
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import { loadCart, subtotalCents } from "./cart";
import { formatCents, formatQuoteLine } from "./format";
import { useAsync } from "./hooks";
import PaymentForm from "./PaymentForm";
import { Button, Card, EmptyState, ErrorNotice, LinkButton, Page, Spinner } from "./ui";
import type { CheckoutIntentResponse, Quote } from "@/lib/contract";

export default function CheckoutClient({ merchantId, publishableKey }: { merchantId: string; publishableKey: string | undefined }) {
  const [subtotal, setSubtotal] = useState<number | null>(null);
  const [roundUp, setRoundUp] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [intent, setIntent] = useState<CheckoutIntentResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false); // intent kept, but user is changing the order
  const [intentError, setIntentError] = useState<string | null>(null);

  const merchant = useAsync(() => api.getMerchant(merchantId), [merchantId]);
  const causeId = merchant.data?.activeCauseId ?? null;
  const cause = useAsync(
    async () => (causeId ? api.getCauseById(causeId) : null),
    [causeId, merchant.data?.id],
  );

  useEffect(() => {
    setSubtotal(subtotalCents(loadCart(merchantId)));
  }, [merchantId]);

  const ruleType = merchant.data?.ruleType;
  const merchantReady = merchant.data !== undefined; // identity-stable: polling/refetch must not re-quote
  const effectiveRoundUp = ruleType === "ROUND_UP" ? roundUp : false;

  // Server-side quote on every change; stale responses are ignored.
  useEffect(() => {
    if (!merchantReady || !subtotal) return;
    const ctrl = new AbortController();
    setQuoteError(null);
    setQuote(null); // never show/accept a stale total while a new quote loads
    api
      .quote({ merchantId, itemAmountCents: subtotal, roundUp: effectiveRoundUp }, ctrl.signal)
      .then((q) => {
        if (!ctrl.signal.aborted) setQuote(q);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted && (e as Error).name !== "AbortError") {
          setQuote(null);
          setQuoteError(errorMessage(e));
        }
      });
    return () => ctrl.abort();
  }, [merchantId, merchantReady, subtotal, effectiveRoundUp]);

  async function startPayment() {
    if (!subtotal) return;
    // Reuse the existing PaymentIntent if the order is unchanged (avoids orphaned intents).
    if (intent && intent.quote.itemAmountCents === subtotal && intent.quote.roundUp === effectiveRoundUp) {
      setEditing(false);
      return;
    }
    setCreating(true);
    setIntentError(null);
    try {
      setIntent(await api.intent({ merchantId, itemAmountCents: subtotal, roundUp: effectiveRoundUp }));
      setEditing(false);
    } catch (e) {
      setIntentError(errorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  if (subtotal === null || (merchant.loading && !merchant.data)) return <Page title="Checkout"><Spinner /></Page>;
  if (!merchant.data) {
    return (
      <Page title="Checkout">
        <ErrorNotice message={merchant.error ?? "Shop not found."} onRetry={merchant.reload} />
      </Page>
    );
  }
  if (subtotal === 0) {
    return (
      <Page title="Checkout">
        <EmptyState title="Your cart is empty">
          <LinkButton href={`/shop/${merchantId}`}>Back to shop</LinkButton>
        </EmptyState>
      </Page>
    );
  }

  const causeTitle = cause.data?.title ?? "a local cause";
  const pctLabel = `${(merchant.data.percentageBps / 100).toString()}%`;
  const locked = intent !== null && !editing;
  const shown = locked ? intent!.quote : quote;

  return (
    <Page title="Checkout">
      <Card className="mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Supporting</p>
        {cause.loading && !cause.data ? (
          <Spinner label="Loading cause…" />
        ) : cause.data ? (
          <>
            <p className="font-semibold text-slate-900">{cause.data.title}</p>
            <p className="text-sm text-slate-600">{cause.data.city}</p>
            <Link href={`/causes/${cause.data.slug}`} className="text-sm text-indigo-600 underline">
              Read their story
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            {merchant.data.name} has no active cause selected.
          </p>
        )}
      </Card>

      <Card className="mb-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-medium">{formatCents(subtotal)}</span>
        </div>

        {ruleType === "ROUND_UP" ? (
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={roundUp}
              disabled={locked}
              onChange={(e) => setRoundUp(e.target.checked)}
            />
            <span className="text-sm">Round up to donate to {causeTitle}</span>
          </label>
        ) : (
          <p className="text-sm text-slate-700">
            {pctLabel} of this purchase goes to {causeTitle}. No extra charge to you.
          </p>
        )}

        {quoteError && <ErrorNotice message={quoteError} />}
        <div aria-live="polite">
        {shown && (
          <div className="rounded-lg bg-emerald-50 p-3">
            {shown.ruleType === "ROUND_UP" ? (
              <p className="font-semibold text-emerald-900">{formatQuoteLine(shown)}</p>
            ) : (
              <p className="font-semibold text-emerald-900">
                {formatCents(shown.donationCents)} donated · Total {formatCents(shown.totalCents)}
              </p>
            )}
          </div>
        )}
        </div>
      </Card>

      {locked && intent ? (
        <div className="space-y-3">
          <PaymentForm
            publishableKey={publishableKey}
            clientSecret={intent.clientSecret}
            returnUrl={`${window.location.origin}/shop/${merchantId}/success`}
            payLabel={`Pay ${formatCents(intent.quote.totalCents)}`}
          />
          <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
            Edit order
          </Button>
        </div>
      ) : (
        <>
          {intentError && <div className="mb-3"><ErrorNotice message={intentError} /></div>}
          <Button className="w-full" disabled={!quote || creating} onClick={startPayment}>
            {creating ? "Preparing payment…" : quote ? `Continue to payment · ${formatCents(quote.totalCents)}` : "Calculating…"}
          </Button>
        </>
      )}
    </Page>
  );
}
