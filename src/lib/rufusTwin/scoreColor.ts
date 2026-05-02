/** Tailwind class fragments for score-based coloring (matches dashboard patterns). */
export function getScoreColor(score: number): {
  text: string;
  bar: string;
  pill: string;
} {
  if (score >= 70) {
    return {
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      pill:
        "border-emerald-200 bg-emerald-50 text-emerald-900",
    };
  }
  if (score >= 40) {
    return {
      text: "text-amber-800",
      bar: "bg-amber-500",
      pill: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    text: "text-red-700",
    bar: "bg-red-500",
    pill: "border-red-200 bg-red-50 text-red-900",
  };
}

export function scoreGradeLetter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
