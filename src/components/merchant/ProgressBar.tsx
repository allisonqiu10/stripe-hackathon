// OWNER: P3
import { formatUSD } from "./money";

export function ProgressBar({ raisedCents, goalCents }: { raisedCents: number; goalCents: number }) {
  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% of goal raised`}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {formatUSD(raisedCents)} of {formatUSD(goalCents)} ({pct}%)
      </p>
    </div>
  );
}
