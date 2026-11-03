// OWNER: P4
"use client";
import { useState, type FormEvent } from "react";
import { api, errorMessage, isSafeRedirect } from "@/components/customer/api";
import { formatCents, parseDollarsToCents } from "@/components/customer/format";
import { Button, Card, ErrorNotice, Field, Page, inputClass } from "@/components/customer/ui";
import type { Cause } from "@/lib/contract";

export default function NewCausePage() {
  const [created, setCreated] = useState<Cause | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const goalCents = parseDollarsToCents(String(f.get("goal")));
    if (goalCents === null) return setError("Enter a goal in dollars, like 2500 or 2500.50.");
    if (f.get("confirm") !== "on") return setError("Please confirm the eligibility statement.");
    setBusy(true);
    setError(null);
    try {
      setCreated(
        await api.createCause({
          title: String(f.get("title")).trim(),
          description: String(f.get("description")).trim(),
          city: String(f.get("city")).trim(),
          ownerName: String(f.get("ownerName")).trim(),
          goalCents,
        }),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onboard() {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.onboardCause(created.id);
      if (!isSafeRedirect(url)) throw new Error("Received an unexpected onboarding link.");
      window.location.assign(url);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Page title="Cause created">
        <Card className="space-y-3">
          <p className="font-semibold">{created.title}</p>
          <p className="text-sm text-slate-600">
            Goal {formatCents(created.goalCents)}. To receive funds, finish setup with Stripe. Stripe collects
            your identity and payout details directly; we never see them.
          </p>
          {error && <ErrorNotice message={error} />}
          <Button className="w-full" onClick={onboard} disabled={busy}>
            {busy ? "Redirecting…" : "Onboard to receive funds"}
          </Button>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Register a cause">
      <div role="note" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Eligibility:</strong> the beneficiary must be an adult (18+) or an organization able to hold a
        Stripe account. Funds cannot be paid out to minors.
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Title"><input name="title" required maxLength={120} className={inputClass} /></Field>
        <Field label="Story"><textarea name="description" required rows={5} maxLength={2000} className={inputClass} /></Field>
        <Field label="City"><input name="city" required maxLength={80} className={inputClass} /></Field>
        <Field label="Beneficiary or organization name"><input name="ownerName" required maxLength={120} className={inputClass} /></Field>
        <Field label="Fundraising goal (USD)" hint="Whole or decimal dollars, e.g. 2500">
          <input name="goal" required inputMode="decimal" className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="confirm" required className="mt-1 h-5 w-5" />
          <span>I confirm the beneficiary is an adult or an organization able to hold a Stripe account.</span>
        </label>
        {error && <ErrorNotice message={error} />}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating…" : "Create cause"}
        </Button>
      </form>
    </Page>
  );
}
