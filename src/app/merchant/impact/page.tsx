// OWNER: P3
"use client";
import { useState } from "react";
import { getImpact } from "@/components/merchant/api";
import { badgeEmbedSnippet, ImpactBadge } from "@/components/merchant/ImpactBadge";
import { useMerchant } from "@/components/merchant/MerchantShell";
import { formatUSD } from "@/components/merchant/money";
import { Async, Empty } from "@/components/merchant/States";
import { useAsync } from "@/components/merchant/useAsync";

export default function ImpactPage() {
  const { merchant } = useMerchant();
  const { state, reload } = useAsync(() => getImpact(merchant.id), [merchant.id]);
  const [copied, setCopied] = useState(false);

  return (
    <Async state={state} onRetry={reload}>
      {(impact) =>
        impact.donationCount === 0 ? (
          <Empty title="No donations yet">Once customers donate at checkout, your impact shows up here.</Empty>
        ) : (
          <div className="space-y-8">
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                ["Total donated", formatUSD(impact.totalDonatedCents)],
                ["Orders", String(impact.orderCount)],
                ["Donations", String(impact.donationCount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-gray-200 p-4">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-xl font-semibold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="by-cause">
              <h2 id="by-cause" className="mb-2 text-sm font-medium text-gray-900">
                By cause
              </h2>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="py-1 font-medium">Cause</th>
                    <th className="py-1 text-right font-medium">Donated</th>
                  </tr>
                </thead>
                <tbody>
                  {impact.byCause.map((c) => (
                    <tr key={c.causeId} className="border-t border-gray-100">
                      <td className="py-2">{c.title}</td>
                      <td className="py-2 text-right">{formatUSD(c.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section aria-labelledby="badge" className="space-y-3">
              <h2 id="badge" className="text-sm font-medium text-gray-900">
                Show it off
              </h2>
              <ImpactBadge totalDonatedCents={impact.totalDonatedCents} />
              <div>
                <label htmlFor="embed" className="block text-xs text-gray-600">
                  Embed code
                </label>
                <textarea
                  id="embed"
                  readOnly
                  rows={3}
                  value={badgeEmbedSnippet(impact.totalDonatedCents)}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(badgeEmbedSnippet(impact.totalDonatedCents));
                      setCopied(true);
                    } catch {
                      setCopied(false);
                    }
                  }}
                  className="mt-1 text-sm underline"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>
          </div>
        )
      }
    </Async>
  );
}
