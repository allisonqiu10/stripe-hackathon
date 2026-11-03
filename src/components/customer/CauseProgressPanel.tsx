// OWNER: P4
"use client";
import { api } from "./api";
import { formatCents, timeAgo } from "./format";
import { useAsync } from "./hooks";
import { Card, EmptyState, ErrorNotice, ProgressBar, Spinner } from "./ui";

export const POLL_MS = 4000;

export default function CauseProgressPanel({ slug }: { slug: string }) {
  const { data, error, loading, reload } = useAsync(() => api.getProgress(slug), [slug], POLL_MS);

  if (!data) {
    if (loading) return <Spinner label="Loading progress…" />;
    return <ErrorNotice message={error ?? "Could not load progress."} onRetry={reload} />;
  }

  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-2xl font-bold text-slate-900">{formatCents(data.raisedCents)}</p>
        <p className="text-sm text-slate-500">of {formatCents(data.goalCents)} goal</p>
      </div>
      <ProgressBar raisedCents={data.raisedCents} goalCents={data.goalCents} />
      <p className="mt-2 text-sm text-slate-600">
        {data.donorCount} {data.donorCount === 1 ? "donation" : "donations"}
      </p>
      {error && <p className="mt-2 text-xs text-amber-700">Live updates paused. Retrying…</p>}

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Recent donations</h3>
      {data.recent.length === 0 ? (
        <EmptyState title="No donations yet">Be the first to give.</EmptyState>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {data.recent.map((r) => (
            <li key={`${r.createdAt}-${r.amountCents}`} className="flex justify-between py-2 text-sm">
              <span className="font-medium">{formatCents(r.amountCents)}</span>
              <span className="text-slate-500">{timeAgo(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
