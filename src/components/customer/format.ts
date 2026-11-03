// OWNER: P4
// Display-only helpers. Never used to compute chargeable amounts.

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatQuoteLine(q: {
  itemAmountCents: number;
  donationCents: number;
  totalCents: number;
}): string {
  return `${formatCents(q.itemAmountCents)} + ${formatCents(q.donationCents)} → ${formatCents(q.totalCents)}`;
}

/** "12", "12.5", "1,000.10" -> cents. Returns null if invalid or <= 0. Integer math only. */
export function parseDollarsToCents(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function progressPercent(raisedCents: number, goalCents: number): number {
  if (goalCents <= 0 || raisedCents <= 0) return 0;
  return Math.min(100, Math.floor((raisedCents * 100) / goalCents));
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
