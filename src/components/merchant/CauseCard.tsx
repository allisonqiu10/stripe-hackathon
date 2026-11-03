// OWNER: P3
"use client";
import { getProgress, type Cause } from "./api";
import { ProgressBar } from "./ProgressBar";
import { Async } from "./States";
import { useAsync } from "./useAsync";

export function CauseCard({
  cause,
  selected,
  busy,
  onSelect,
}: {
  cause: Cause;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
  const { state, reload } = useAsync(() => getProgress(cause.slug), [cause.slug]);

  return (
    <li className={`flex flex-col gap-3 rounded-lg border p-4 ${selected ? "border-emerald-500 ring-1 ring-emerald-500" : "border-gray-200"}`}>
      <div>
        <h3 className="font-semibold text-gray-900">{cause.title}</h3>
        <p className="text-xs text-gray-500">
          {cause.city} · by {cause.ownerName}
        </p>
        <p className="mt-2 text-sm text-gray-700">{cause.description}</p>
      </div>
      <Async state={state} onRetry={reload}>
        {(p) => (
          <>
            <ProgressBar raisedCents={p.raisedCents} goalCents={p.goalCents} />
            <p className="text-xs text-gray-500">{p.donorCount} donors</p>
          </>
        )}
      </Async>
      <button
        type="button"
        onClick={onSelect}
        disabled={selected || busy}
        aria-pressed={selected}
        className="mt-auto rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:bg-emerald-600"
      >
        {selected ? "Your active cause" : "Choose this cause"}
      </button>
    </li>
  );
}
