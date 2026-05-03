"use client";

import { useCallback } from "react";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import type { MarketIntelDto, PurchaseCriteriaRow, ReviewJob } from "./types";

const COLORS = [
 "bg-red-600",
 "bg-orange-500",
 "bg-amber-500",
 "bg-sky-600",
 "bg-teal-600",
];

type Props = {
 job: ReviewJob;
 intel: MarketIntelDto;
 criteria: PurchaseCriteriaRow[];
};

function downloadReport(job: ReviewJob, intel: MarketIntelDto, criteria: PurchaseCriteriaRow[]) {
 const userListing = job.listings.find((l) => l.isUserListing) ?? job.listings[0];
 const title = userListing?.title ?? "Product";
 const lines: string[] = [
 "REVIEW ANALYTICS REPORT",
 `Product: ${title}`,
 `ASIN: ${job.userAsin}`,
 `Generated: ${new Date().toISOString()}`,
 "",
 "KEY PURCHASE CRITERIA:",
 ...criteria.map(
 (c) =>
 `- ${c.criteriaName}: importance ${Math.round(c.importanceScore)}, your score ${Math.round(c.yourListingScore)}, market satisfaction ${Math.round(c.satisfactionScore)}`,
 ),
 "",
 "YOUR STRENGTHS:",
 ...(intel.yourStrengths ?? []).map((s) => `- ${s}`),
 "",
 "YOUR WEAKNESSES:",
 ...(intel.yourWeaknesses ?? []).map((s) => `- ${s}`),
 "",
 "RECOMMENDED IMPROVEMENTS:",
 ...(intel.listingImprovements ?? []).map((s, i) => `${i + 1}. ${s}`),
 "",
 "UNMET NEEDS (OPPORTUNITIES):",
 ...(intel.unmetNeeds ?? []).map((s) => `- ${s}`),
 ];
 const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `review-analytics-${job.userAsin || "report"}.txt`;
 a.click();
 URL.revokeObjectURL(url);
}

export function ActionPlanTab({ job, intel, criteria }: Props) {
 const strengths = intel.yourStrengths ?? [];
 const weaknesses = intel.yourWeaknesses ?? [];
 const improvements = (intel.listingImprovements ?? []).slice(0, 5);

 const onExport = useCallback(() => {
 downloadReport(job, intel, criteria);
 }, [job, intel, criteria]);

 return (
 <div className="space-y-8">
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
 <div>
 <h3 className="font-heading text-sm font-semibold text-foreground"> Your Listing Wins</h3>
 <p className="mt-1 text-xs text-muted-foreground">
 Based on review sentiment vs competitors
 </p>
 <ul className="mt-3 space-y-2">
 {strengths.map((s) => (
 <li
 key={s}
 className="flex gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2.5 text-sm text-foreground dark:border-emerald-500/25 dark:bg-emerald-950/30"
 >
 <FaCheck className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
 {s}
 </li>
 ))}
 </ul>
 </div>
 <div>
 <h3 className="font-heading text-sm font-semibold text-foreground">
 Competitors Win Here
 </h3>
 <p className="mt-1 text-xs text-muted-foreground">
 Areas where competitor reviews outperform yours
 </p>
 <ul className="mt-3 space-y-2">
 {weaknesses.map((s) => (
 <li
 key={s}
 className="flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm text-foreground dark:border-amber-500/25 dark:bg-amber-950/25"
 >
 <FaExclamationTriangle
 className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
 aria-hidden
 />
 {s}
 </li>
 ))}
 </ul>
 </div>
 </div>

 <section>
 <h3 className="font-heading text-base font-semibold text-foreground">
 Recommended Listing Improvements
 </h3>
 <p className="mt-1 text-sm text-muted-foreground">
 In order of impact — based on what customers love about your top competitors
 </p>
 <ol className="mt-4 space-y-3">
 {improvements.map((text, i) => {
 const n = i + 1;
 const color = COLORS[i] ?? "bg-muted-foreground";
 const impact = n <= 2 ? "High" : n <= 4 ? "Medium" : "Low";
 return (
 <li
 key={text}
 className="flex gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]"
 >
 <span
 className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${color}`}
 >
 {n}
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-foreground">{text}</p>
 <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
 Impact: {impact}
 </p>
 </div>
 </li>
 );
 })}
 </ol>
 </section>

 <button
 type="button"
 onClick={onExport}
 className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]"
 >
 Export Action Plan
 </button>
 </div>
 );
}
