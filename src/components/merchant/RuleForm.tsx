// OWNER: P3
"use client";
import { useId, useState } from "react";
import { patchMerchant, type Merchant, type RuleType } from "./api";
import { formatUSD, previewDonation } from "./money";

const SAMPLES = [450, 1000, 1299, 2575];

export function RuleForm({ merchant, onSaved }: { merchant: Merchant; onSaved: (m: Merchant) => void }) {
  const uid = useId();
  const [ruleType, setRuleType] = useState<RuleType>(merchant.ruleType);
  const [bps, setBps] = useState(merchant.percentageBps);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = ruleType !== merchant.ruleType || bps !== merchant.percentageBps;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await patchMerchant(merchant.id, { ruleType, percentageBps: bps });
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-900">Donation rule</legend>
        {(
          [
            ["ROUND_UP", "Round-up", "Customers opt in to round their total up to the next dollar."],
            ["PERCENTAGE", "Percentage of revenue", "You donate a share of every sale."],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
            <input
              type="radio"
              name={`${uid}-rule`}
              value={value}
              checked={ruleType === value}
              onChange={() => setRuleType(value)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">{label}</span>
              <span className="block text-xs text-gray-600">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {ruleType === "PERCENTAGE" && (
        <div>
          <label htmlFor={`${uid}-bps`} className="block text-sm font-medium text-gray-900">
            Percentage: {(bps / 100).toFixed(2)}% ({bps} bps)
          </label>
          <input
            id={`${uid}-bps`}
            type="range"
            min={0}
            max={1000}
            step={5}
            value={Math.min(bps, 1000)}
            onChange={(e) => setBps(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <p className="text-xs text-gray-500">0% to 10%</p>
        </div>
      )}

      <section aria-labelledby={`${uid}-prev`}>
        <h3 id={`${uid}-prev`} className="text-sm font-medium text-gray-900">
          Live preview (estimate)
        </h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="py-1 pr-4 font-medium">Item</th>
                <th className="py-1 pr-4 font-medium">Donation</th>
                <th className="py-1 pr-4 font-medium">Customer pays</th>
                <th className="py-1 font-medium">You keep</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLES.map((item) => {
                const p = previewDonation({ ruleType, itemAmountCents: item, percentageBps: bps, roundUp: true });
                return (
                  <tr key={item} className="border-t border-gray-100">
                    <td className="py-1 pr-4">{formatUSD(item)}</td>
                    <td className="py-1 pr-4">{formatUSD(p.donationCents)}</td>
                    <td className="py-1 pr-4">{formatUSD(p.totalCents)}</td>
                    <td className="py-1">{formatUSD(p.merchantKeepsCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-gray-500">Preview only. Final amounts are calculated at checkout.</p>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save rules"}
        </button>
        {saved && !dirty && (
          <span role="status" className="text-sm text-emerald-700">
            Saved
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
