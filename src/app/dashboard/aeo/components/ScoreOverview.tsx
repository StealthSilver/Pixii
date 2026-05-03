function scoreTone(score: number | null): "good" | "mid" | "bad" | "na" {
  if (score === null || score === undefined) {
    return "na";
  }
  if (score >= 70) {
    return "good";
  }
  if (score >= 40) {
    return "mid";
  }
  return "bad";
}

function arcStrokeClass(tone: ReturnType<typeof scoreTone>): string {
  if (tone === "good") {
    return "stroke-emerald-600 dark:stroke-emerald-400";
  }
  if (tone === "mid") {
    return "stroke-amber-600 dark:stroke-amber-400";
  }
  if (tone === "bad") {
    return "stroke-red-600 dark:stroke-red-400";
  }
  return "stroke-muted-foreground/40";
}

export function letterGrade(score: number | null): string {
  if (score === null || score === undefined) {
    return "—";
  }
  if (score >= 90) {
    return "A";
  }
  if (score >= 75) {
    return "B";
  }
  if (score >= 55) {
    return "C";
  }
  if (score >= 40) {
    return "D";
  }
  return "F";
}

type ScoreOverviewProps = {
  overallScore: number | null;
  rankSummary: number | null;
  brandsMentionedCount: number;
  gptScore: number | null;
  claudeScore: number | null;
  geminiScore: number | null;
};

export function ScoreOverview({
  overallScore,
  rankSummary,
  brandsMentionedCount,
  gptScore,
  claudeScore,
  geminiScore,
}: ScoreOverviewProps) {
  const display = overallScore ?? 0;
  const tone = overallScore === null ? "na" : scoreTone(overallScore);
  const arcClass = arcStrokeClass(tone);
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct =
    overallScore === null
      ? 0
      : Math.min(100, Math.max(0, display)) / 100;
  const dash = c * pct;

  const pillClass = (s: number | null) => {
    const t = scoreTone(s);
    const base =
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ";
    if (t === "good") {
      return (
        base +
        "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200"
      );
    }
    if (t === "mid") {
      return (
        base +
        "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
      );
    }
    if (t === "bad") {
      return (
        base +
        "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200"
      );
    }
    return base + "border-border bg-muted text-muted-foreground";
  };

  const rankLine =
    rankSummary !== null && rankSummary !== undefined
      ? `You rank #${rankSummary} out of ${brandsMentionedCount} brands mentioned across AI engines`
      : `Across AI engines, up to ${brandsMentionedCount} brands were surfaced for this query.`;

  return (
    <section className="rounded-xl border border-border/80 bg-card/95 p-6 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
        <div className="relative flex size-36 items-center justify-center">
          <svg className="size-36 -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              className="stroke-border"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              className={arcClass}
              strokeWidth="10"
              strokeDasharray={`${dash} ${c}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl font-bold text-foreground">
              {overallScore === null ? "—" : display}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Overall AEO
            </span>
          </div>
        </div>
        <div className="max-w-md text-center sm:text-left">
          <div className="flex flex-wrap items-end justify-center gap-3 sm:justify-start">
            <p className="font-heading text-2xl font-semibold text-foreground">
              Score overview
            </p>
            <span className="rounded-lg border border-border bg-muted px-2.5 py-1 font-heading text-xl font-bold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              {letterGrade(overallScore)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {rankLine}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className={pillClass(gptScore)}>
              <span className="text-muted-foreground">GPT</span>{" "}
              {gptScore ?? "—"}
            </span>
            <span className={pillClass(claudeScore)}>
              <span className="text-muted-foreground">Mini</span>{" "}
              {claudeScore ?? "—"}
            </span>
            <span className={pillClass(geminiScore)}>
              <span className="text-muted-foreground">Gemini</span>{" "}
              {geminiScore ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
