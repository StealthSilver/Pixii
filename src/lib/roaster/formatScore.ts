/** Tailwind text color class for a 0–100 score (matches dashboard score bars). */
export function formatScore(n: number): string {
  if (n >= 70) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (n >= 40) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-red-600 dark:text-red-400";
}
