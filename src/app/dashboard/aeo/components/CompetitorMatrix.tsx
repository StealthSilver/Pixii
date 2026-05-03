type Row = {
  name: string;
  gptRank: number | null;
  claudeRank: number | null;
  geminiRank: number | null;
  avgScore: number;
  sentiment: string;
};

type CompetitorMatrixProps = {
  brandName: string;
  rows: Row[];
};

function rankCell(v: number | null): string {
  if (v === null || v === undefined) {
    return "—";
  }
  return `#${v}`;
}

function sentBadge(s: string): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
  if (s === "positive") {
    return (
      base +
      "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200"
    );
  }
  if (s === "negative") {
    return (
      base +
      "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200"
    );
  }
  if (s === "neutral") {
    return (
      base +
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
    );
  }
  return base + "border-border bg-muted text-muted-foreground";
}

function avgTone(score: number): "good" | "mid" | "bad" {
  if (score >= 70) {
    return "good";
  }
  if (score >= 40) {
    return "mid";
  }
  return "bad";
}

function scoreClsForTone(tone: ReturnType<typeof avgTone>): string {
  if (tone === "good") {
    return "font-semibold text-emerald-700 dark:text-emerald-400";
  }
  if (tone === "mid") {
    return "font-semibold text-amber-700 dark:text-amber-400";
  }
  return "font-semibold text-red-700 dark:text-red-400";
}

export function CompetitorMatrix({ brandName, rows }: CompetitorMatrixProps) {
  const bn = brandName.trim().toLowerCase();
  return (
    <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Competitor matrix
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Rankings are parsed mentions within each model&apos;s answer (max eight
        rows).
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="border-b border-border/70 px-3 py-2">Brand</th>
              <th className="border-b border-border/70 px-3 py-2">
                Detailed rank
              </th>
              <th className="border-b border-border/70 px-3 py-2">
                Concise rank
              </th>
              <th className="border-b border-border/70 px-3 py-2">
                Brands rank
              </th>
              <th className="border-b border-border/70 px-3 py-2">Avg score</th>
              <th className="border-b border-border/70 px-3 py-2">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, rowIdx) => {
              const rowName = String(r.name ?? "").trim();
              const isUser = rowName.toLowerCase() === bn;
              const tone = avgTone(r.avgScore);
              const scoreCls = scoreClsForTone(tone);
              return (
                <tr
                  key={rowName ? rowName : `row-${rowIdx}`}
                  className={
                    isUser
                      ? "bg-primary/[0.06] text-foreground ring-1 ring-inset ring-primary/20 dark:bg-primary/10"
                      : "hover:bg-foreground/[0.04]"
                  }
                >
                  <td
                    className={
                      "border-b border-border/55 px-3 py-2.5 font-semibold " +
                      (isUser ? "border-l-[3px] border-l-primary pl-2" : "")
                    }
                  >
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{rowName}</span>
                      {isUser ? (
                        <span className="text-[11px] font-semibold text-primary">
                          You
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="border-b border-border/55 px-3 py-2.5 text-foreground">
                    {rankCell(r.gptRank)}
                  </td>
                  <td className="border-b border-border/55 px-3 py-2.5 text-foreground">
                    {rankCell(r.claudeRank)}
                  </td>
                  <td className="border-b border-border/55 px-3 py-2.5 text-foreground">
                    {rankCell(r.geminiRank)}
                  </td>
                  <td
                    className={
                      "border-b border-border/55 px-3 py-2.5 " + scoreCls
                    }
                  >
                    {r.avgScore}
                  </td>
                  <td className="border-b border-border/55 px-3 py-2.5">
                    <span className={sentBadge(r.sentiment)}>
                      {r.sentiment.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
