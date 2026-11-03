// OWNER: P3
"use client";
import { useId, useState } from "react";
import { listCauses, patchMerchant } from "@/components/merchant/api";
import { CauseCard } from "@/components/merchant/CauseCard";
import { useMerchant } from "@/components/merchant/MerchantShell";
import { Async, Empty, ErrorBox } from "@/components/merchant/States";
import { useAsync } from "@/components/merchant/useAsync";

export default function CausePage() {
  const { merchant, refreshMerchant } = useMerchant();
  const cityId = useId();
  const [city, setCity] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state, reload } = useAsync(() => listCauses(appliedCity || undefined), [appliedCity]);

  async function choose(causeId: string) {
    setBusy(true);
    setError(null);
    try {
      await patchMerchant(merchant.id, { activeCauseId: causeId });
      refreshMerchant();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your choice");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedCity(city.trim());
        }}
      >
        <div className="flex-1">
          <label htmlFor={cityId} className="block text-sm font-medium text-gray-900">
            Filter by city
          </label>
          <input
            id={cityId}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Austin"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Apply
        </button>
      </form>

      {error && <ErrorBox message={error} />}

      <Async state={state} onRetry={reload}>
        {(causes) =>
          causes.length === 0 ? (
            <Empty title="No active causes found">
              {appliedCity ? `Nothing active in ${appliedCity} yet. Try another city.` : "Check back soon."}
            </Empty>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {causes.map((c) => (
                <CauseCard
                  key={c.id}
                  cause={c}
                  selected={merchant.activeCauseId === c.id}
                  busy={busy}
                  onSelect={() => choose(c.id)}
                />
              ))}
            </ul>
          )
        }
      </Async>
    </div>
  );
}
