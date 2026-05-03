"use client";

import type { PurchaseCriteriaRow } from "./types";

function scoreBarClass(score: number): string {
 if (score >= 70) {
 return "bg-emerald-500";
 }
 if (score >= 40) {
 return "bg-amber-500";
 }
 return "bg-red-500";
}

type Props = {
 criteria: PurchaseCriteriaRow[];
 keyInsight: string;
};

export function PurchaseCriteriaTab({ criteria, keyInsight }: Props) {
 const sorted = [...criteria].sort((a, b) => b.importanceScore - a.importanceScore);

 return (
 <div className="space-y-6">
 <p className="rounded-lg border border-border bg-muted/80 px-4 py-3 text-sm text-foreground/90">
 These are the {sorted.length} things customers actually base their purchase decision
 on — ranked by how often they&apos;re mentioned.
 </p>

 <div className="space-y-4">
 {sorted.map((c) => {
 const diff = c.yourListingScore - c.competitorAvgScore;
 let badge = (
 <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-foreground/90">
 Competitive
 </span>
 );
 if (diff > 10) {
 badge = (
 <span className="rounded-full border border-emerald-200/90 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100">
 You win here
 </span>
 );
 } else if (diff < -10) {
 badge = (
 <span className="rounded-full border border-red-200/90 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-950 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100">
 Competitors win
 </span>
 );
 }

 return (
 <article
 key={c.criteriaName + c.importanceScore}
 className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]"
 >
 <div className="flex flex-wrap items-start justify-between gap-2">
 <h3 className="font-heading text-base font-semibold text-foreground">
 {c.criteriaName}
 </h3>
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-full border border-sky-200/90 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-950 dark:border-sky-500/35 dark:bg-sky-950/40 dark:text-sky-100">
 Mentioned in ~{c.mentionCount} reviews
 </span>
 {badge}
 </div>
 </div>

 <div className="mt-4 grid gap-4 md:grid-cols-2">
 <div>
 <div className="flex justify-between text-xs font-medium text-muted-foreground">
 <span>Market Satisfaction</span>
 <span>{Math.round(c.satisfactionScore)}/100</span>
 </div>
 <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className={`h-full rounded-full ${scoreBarClass(c.satisfactionScore)}`}
 style={{ width: `${Math.min(100, c.satisfactionScore)}%` }}
 />
 </div>
 </div>
 <div>
 <div className="flex justify-between text-xs font-medium text-muted-foreground">
 <span>Your Listing</span>
 <span>{Math.round(c.yourListingScore)}/100</span>
 </div>
 <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className={`h-full rounded-full ${scoreBarClass(c.yourListingScore)}`}
 style={{ width: `${Math.min(100, c.yourListingScore)}%` }}
 />
 </div>
 </div>
 </div>

 <div className="mt-4 grid gap-3 md:grid-cols-2">
 <blockquote className="border-l-4 border-emerald-500 pl-3 text-xs italic text-muted-foreground">
 {c.topPositiveQuote}
 </blockquote>
 <blockquote className="border-l-4 border-red-500 pl-3 text-xs italic text-muted-foreground">
 {c.topNegativeQuote}
 </blockquote>
 </div>
 </article>
 );
 })}
 </div>

 {keyInsight ? (
 <div className="rounded-xl border border-primary/30 bg-primary/[0.07] p-5 shadow-sm ring-1 ring-black/[0.03] dark:bg-primary/10 dark:ring-white/[0.06]">
 <p className="text-xs font-semibold uppercase tracking-wide text-primary">
 Key Insight
 </p>
 <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
 {keyInsight}
 </p>
 </div>
 ) : null}
 </div>
 );
}
