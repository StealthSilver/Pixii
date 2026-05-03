"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { HistoryStripItem } from "./types";

type HistoryViewProps = {
 items: HistoryStripItem[];
 onView: (id: string) => void;
 onDelete: (id: string) => void;
 busyId: string | null;
};

function competitionPill(level: string): string {
 switch (level) {
 case "low":
 return "border border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-100";
 case "medium":
 return "border border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100";
 case "high":
 return "border border-orange-200/90 bg-orange-50 text-orange-950 dark:border-orange-500/35 dark:bg-orange-950/45 dark:text-orange-100";
 case "very_high":
 return "border border-red-200/90 bg-red-50 text-red-950 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-100";
 default:
 return "border border-border bg-muted/80 text-foreground";
 }
}

export function HistoryView({
 items,
 onView,
 onDelete,
 busyId,
}: HistoryViewProps) {
 if (!items.length) {
 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-8 text-center shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <p className="text-sm text-muted-foreground">
 No analyses yet. Paste a Best Sellers URL to get started.
 </p>
 </section>
 );
 }

 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
 Analysis history
 </h2>
 <ul className="mt-4 divide-y divide-border/50">
 {items.map((h) => (
 <li
 key={h._id}
 className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-foreground">{h.category}</p>
 <p className="mt-0.5 truncate text-xs text-muted-foreground" title={h.amazonUrl}>
 {h.amazonUrl}
 </p>
 <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
 <span className="font-semibold text-emerald-700 dark:text-emerald-400">
 {formatRevenue(h.marketAnalysis.totalMarketSizeMonthly)} / mo
 </span>
 <span className="text-muted-foreground">
 Opportunity {h.marketAnalysis.opportunityScore}/100
 </span>
 <span
 className={`rounded-full px-2 py-0.5 font-semibold ${competitionPill(h.marketAnalysis.competitionLevel)}`}
 >
 {h.marketAnalysis.competitionLevel.replace(/_/g, " ")}
 </span>
 <span className="text-muted-foreground">
 {h.createdAt ? formatRelativeTime(h.createdAt) : ""}
 </span>
 </div>
 </div>
 <div className="flex shrink-0 gap-2">
 <button
 type="button"
 disabled={busyId === h._id}
 onClick={() => onView(h._id)}
 className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 hover:bg-primary/90 disabled:opacity-60 dark:ring-white/15"
 >
 View Results
 </button>
 <button
 type="button"
 disabled={busyId === h._id}
 onClick={() => {
 if (
 typeof window !== "undefined" &&
 window.confirm("Delete this analysis from history?")
 ) {
 onDelete(h._id);
 }
 }}
 className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-black/[0.04] hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:ring-white/[0.06] dark:hover:bg-red-950/40"
 >
 Delete
 </button>
 </div>
 </li>
 ))}
 </ul>
 </section>
 );
}
