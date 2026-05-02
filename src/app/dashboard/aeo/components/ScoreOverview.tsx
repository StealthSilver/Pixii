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

function ringColor(tone: ReturnType<typeof scoreTone>): string {
  if (tone === "good") {
    return "#059669";
  }
  if (tone === "mid") {
    return "#d97706";
  }
  if (tone === "bad") {
    return "#dc2626";
  }
  return "#a3a3a3";
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
  const stroke = ringColor(tone);
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
      return base + "border-emerald-200 bg-emerald-50 text-emerald-900";
    }
    if (t === "mid") {
      return base + "border-amber-200 bg-amber-50 text-amber-900";
    }
    if (t === "bad") {
      return base + "border-red-200 bg-red-50 text-red-900";
    }
    return base + "border-neutral-200 bg-neutral-50 text-neutral-600";
  };

  const rankLine =
    rankSummary !== null && rankSummary !== undefined
      ? `You rank #${rankSummary} out of ${brandsMentionedCount} brands mentioned across AI engines`
      : `Across AI engines, up to ${brandsMentionedCount} brands were surfaced for this query.`;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
        <div className="relative flex size-36 items-center justify-center">
          <svg
            className="size-36 -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeDasharray={`${dash} ${c}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-4xl font-bold text-black">
              {overallScore === null ? "—" : display}
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              Overall AEO
            </span>
          </div>
        </div>
        <div className="max-w-md text-center sm:text-left">
          <div className="flex flex-wrap items-end justify-center gap-3 sm:justify-start">
            <p className="font-heading text-2xl font-semibold text-black">
              Score overview
            </p>
            <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-heading text-xl font-bold text-black">
              {letterGrade(overallScore)}
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{rankLine}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className={pillClass(gptScore)}>
              <span className="text-neutral-500">GPT</span>{" "}
              {gptScore ?? "—"}
            </span>
            <span className={pillClass(claudeScore)}>
              <span className="text-neutral-500">Mini</span>{" "}
              {claudeScore ?? "—"}
            </span>
            <span className={pillClass(geminiScore)}>
              <span className="text-neutral-500">Gemini</span>{" "}
              {geminiScore ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
