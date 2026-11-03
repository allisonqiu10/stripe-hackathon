// OWNER: P3
"use client";
import { useState } from "react";
import { startMerchantOnboarding, type ConnectStatus } from "./api";

export function StatusBanner({ merchantId, status }: { merchantId: string; status: ConnectStatus }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status.onboardingComplete) {
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Stripe onboarding is complete. You can receive payouts.
      </div>
    );
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await startMerchantOnboarding(merchantId);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start onboarding");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Finish Stripe onboarding to start receiving payouts.</p>
      {status.requirementsDue.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {status.requirementsDue.map((r) => (
            <li key={r}>{r.replace(/[._]/g, " ")}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={finish}
        disabled={busy}
        className="mt-3 rounded-md bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {busy ? "Redirecting…" : "Finish Stripe onboarding"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
