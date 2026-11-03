// OWNER: P3
"use client";
import Link from "next/link";
import { getConnectStatus } from "@/components/merchant/api";
import { useMerchant } from "@/components/merchant/MerchantShell";
import { StatusBanner } from "@/components/merchant/StatusBanner";
import { Async } from "@/components/merchant/States";
import { useAsync } from "@/components/merchant/useAsync";

export default function OnboardingComplete() {
  const { merchant, refreshMerchant } = useMerchant();
  const { state, reload } = useAsync(async () => {
    const status = await getConnectStatus(merchant.id);
    refreshMerchant();
    return status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant.id]);

  return (
    <div className="space-y-4">
      <Async state={state} onRetry={reload}>
        {(status) => (
          <>
            <StatusBanner merchantId={merchant.id} status={status} />
            {status.onboardingComplete ? (
              <Link href={`/merchant?merchantId=${encodeURIComponent(merchant.id)}`} className="text-sm underline">
                Back to overview
              </Link>
            ) : (
              <button type="button" onClick={reload} className="text-sm underline">
                Re-check status
              </button>
            )}
          </>
        )}
      </Async>
    </div>
  );
}
