// OWNER: P3
import { formatUSD } from "./money";

export function ImpactBadge({ totalDonatedCents }: { totalDonatedCents: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
      <span aria-hidden="true">💚</span>
      <span>Our customers have raised {formatUSD(totalDonatedCents)} for local causes</span>
    </div>
  );
}

/** HTML a merchant can paste into their own site. Static markup, inline styles only. */
export function badgeEmbedSnippet(totalDonatedCents: number): string {
  const text = `Our customers have raised ${formatUSD(totalDonatedCents)} for local causes`;
  return `<div style="display:inline-block;padding:8px 16px;border:1px solid #6ee7b7;border-radius:9999px;background:#ecfdf5;color:#064e3b;font:500 14px system-ui,sans-serif">💚 ${text}</div>`;
}
