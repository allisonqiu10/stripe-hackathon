// OWNER: P3
"use client";
import { getConnectStatus } from "@/components/merchant/api";
import { useMerchant } from "@/components/merchant/MerchantShell";
import { StatusBanner } from "@/components/merchant/StatusBanner";
import { Async } from "@/components/merchant/States";
import { useAsync } from "@/components/merchant/useAsync";

export default function MerchantOverview() {
  const { merchant } = useMerchant();
  const { state, reload } = useAsync(() => getConnectStatus(merchant.id), [merchant.id]);

  return (
    <div className="space-y-6">
      <Async state={state} onRetry={reload}>
        {(status) => <StatusBanner merchantId={merchant.id} status={status} />}
      </Async>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-xs text-gray-500">Donation rule</dt>
          <dd className="font-medium text-gray-900">
            {merchant.ruleType === "ROUND_UP" ? "Round-up" : `${(merchant.percentageBps / 100).toFixed(2)}% of revenue`}
          </dd>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-xs text-gray-500">Active cause</dt>
          <dd className="font-medium text-gray-900">{merchant.activeCauseId ? "Selected" : "None yet"}</dd>
        </div>
      </dl>
    </div>
  );
}
