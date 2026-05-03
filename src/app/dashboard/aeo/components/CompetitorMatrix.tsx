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
 return base + "border-emerald-200 bg-emerald-50 text-emerald-900";
 }
 if (s === "negative") {
 return base + "border-red-200 bg-red-50 text-red-900";
 }
 if (s === "neutral") {
 return base + "border-amber-200 bg-amber-50 text-amber-900";
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

export function CompetitorMatrix({ brandName, rows }: CompetitorMatrixProps) {
 const bn = brandName.trim().toLowerCase();
 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Competitor matrix
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Rankings are parsed mentions within each model&apos;s answer (max eight
 rows).
 </p>
 <div className="mt-4 overflow-x-auto">
 <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
 <thead>
 <tr className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 <th className="border-b border-border px-3 py-2">Brand</th>
 <th className="border-b border-border px-3 py-2">GPT rank</th>
 <th className="border-b border-border px-3 py-2">Mini rank</th>
 <th className="border-b border-border px-3 py-2">
 Gemini rank
 </th>
 <th className="border-b border-border px-3 py-2">Avg score</th>
 <th className="border-b border-border px-3 py-2">Sentiment</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((r, rowIdx) => {
 const rowName = String(r.name ?? "").trim();
 const isUser = rowName.toLowerCase() === bn;
 const tone = avgTone(r.avgScore);
 const scoreCls =
 tone === "good"
 ? "font-semibold text-emerald-700"
 : tone === "mid"
 ? "font-semibold text-amber-700"
 : "font-semibold text-red-700";
 return (
 <tr
 key={rowName ? rowName : `row-${rowIdx}`}
 className={
 isUser
 ? "bg-primary/[0.06] text-foreground ring-1 ring-inset ring-primary/15"
 : "hover:bg-foreground/[0.05]"
 }
 >
 <td
 className={
 "border-b border-border/55 px-3 py-2.5 font-semibold " +
 (isUser ? "border-l-4 border-l-primary pl-2" : "")
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
 <td className={"border-b border-border/55 px-3 py-2.5 " + scoreCls}>
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
