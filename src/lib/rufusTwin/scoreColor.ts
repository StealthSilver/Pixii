/** Tailwind class fragments for score-based coloring (dashboard + dark). */
export function getScoreColor(score: number): {
  text: string;
  bar: string;
  pill: string;
} {
  if (score >= 70) {
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bar: "bg-emerald-500",
      pill:
        "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-800 dark:text-amber-400",
      bar: "bg-amber-500",
      pill:
        "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100",
    };
  }
  return {
    text: "text-red-700 dark:text-red-400",
    bar: "bg-red-500",
    pill:
      "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200",
  };
}

export function scoreGradeLetter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
