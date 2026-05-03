/** Formats a dollar amount for display: $1.2M, $45K, or $999. */
export function formatRevenue(n: number): string {
  if (!Number.isFinite(n) || n < 0) {
    return "$0";
  }
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `$${k >= 100 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${Math.round(n)}`;
}
