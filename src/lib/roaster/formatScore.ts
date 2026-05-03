/** Tailwind text color class for a 0–100 score (matches dashboard score bars). */
export function formatScore(n: number): string {
  if (n >= 70) {
    return "text-emerald-600";
  }
  if (n >= 40) {
    return "text-amber-600";
  }
  return "text-red-600";
}
