"use client";

import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { MarketJob } from "./types";

type MarketOverviewTabProps = {
 job: MarketJob;
};

function opportunityColor(score: number): string {
 if (score >= 70) {
 return "text-emerald-600";
 }
 if (score >= 40) {
 return "text-amber-600";
 }
 return "text-red-600";
}

function entryLabel(score: number): { text: string; color: string } {
 if (score <= 30) {
 return {
 text: "Low — Good opportunity for new sellers",
 color: "text-emerald-700",
 };
 }
 if (score <= 55) {
 return {
 text: "Medium — Requires differentiation",
 color: "text-amber-700",
 };
 }
 if (score <= 75) {
 return {
 text: "High — Established market, hard to break in",
 color: "text-orange-700",
 };
 }
 return {
 text: "Very High — Dominated market, enter with caution",
 color: "text-red-700",
 };
}

function competitionBadge(level: string): { label: string; className: string } {
 switch (level) {
 case "low":
 return {
 label: " Low Competition",
 className: "bg-emerald-100 text-emerald-900 border-emerald-200",
 };
 case "medium":
 return {
 label: " Medium Competition",
 className: "bg-amber-100 text-amber-900 border-amber-200",
 };
 case "high":
 return {
 label: " High Competition",
 className: "bg-orange-100 text-orange-900 border-orange-200",
 };
 case "very_high":
 default:
 return {
 label: " Very High Competition",
 className: "bg-red-100 text-red-900 border-red-200",
 };
 }
}

function fmtReviews(n: number): string {
 if (n >= 1000) {
 return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
 }
 return String(Math.round(n));
}

export function MarketOverviewTab({ job }: MarketOverviewTabProps) {
 const m = job.marketAnalysis;
 const products = [...job.products].sort((a, b) => a.rank - b.rank);
 const maxRev = Math.max(
 1,
 ...products.map((p) => p.estimatedMonthlyRevenue),
 );
 const entry = entryLabel(m.entryDifficultyScore);
 const comp = competitionBadge(m.competitionLevel);

 return (
 <div className="space-y-6">
 <div className="grid gap-4 sm:grid-cols-3">
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
 {formatRevenue(m.totalMarketSizeMonthly)}
 </p>
 <p className="mt-1 text-sm font-semibold text-foreground">
 Est. Monthly Market Size
 </p>
 <p className="text-xs text-muted-foreground">Top 10 combined revenue</p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="font-heading text-2xl font-bold tracking-tight text-foreground">
 {formatRevenue(m.totalMarketSizeAnnual)}
 </p>
 <p className="mt-1 text-sm font-semibold text-foreground">
 Est. Annual Market Size
 </p>
 <p className="text-xs text-muted-foreground">Extrapolated from top 10</p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p
 className={`font-heading text-2xl font-bold tracking-tight ${opportunityColor(m.opportunityScore)}`}
 >
 {m.opportunityScore}/100
 </p>
 <p className="mt-1 text-sm font-semibold text-foreground">
 Opportunity Score
 </p>
 <p className="text-xs text-muted-foreground">
 Based on entry difficulty and concentration
 </p>
 </div>
 </div>

 <p className="text-[11px] text-muted-foreground">
 * Estimates based on Best Sellers Rank position. For directional research only.
 </p>

 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <div className="rounded-lg border border-border bg-muted/80 px-3 py-3">
 <p className="text-xs font-medium text-muted-foreground"> Avg Price</p>
 <p className="mt-1 font-heading text-lg font-semibold text-foreground">
 ${m.averagePrice.toFixed(2)}
 </p>
 </div>
 <div className="rounded-lg border border-border bg-muted/80 px-3 py-3">
 <p className="text-xs font-medium text-muted-foreground">⭐ Avg Rating</p>
 <p className="mt-1 font-heading text-lg font-semibold text-foreground">
 {m.averageRating.toFixed(1)} / 5.0
 </p>
 </div>
 <div className="rounded-lg border border-border bg-muted/80 px-3 py-3">
 <p className="text-xs font-medium text-muted-foreground"> Avg Reviews</p>
 <p className="mt-1 font-heading text-lg font-semibold text-foreground">
 {fmtReviews(m.averageReviewCount)}
 </p>
 </div>
 <div className="rounded-lg border border-border bg-muted/80 px-3 py-3">
 <p className="text-xs font-medium text-muted-foreground">
 Market Concentration
 </p>
 <p className="mt-1 font-heading text-lg font-semibold text-foreground">
 {m.marketConcentrationScore}%
 </p>
 <p className="text-[11px] text-muted-foreground">of revenue in top 3</p>
 </div>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="text-sm font-semibold text-foreground">Entry Difficulty</p>
 <p className={`mt-1 text-xs ${entry.color}`}>{entry.text}</p>
 <div className="mt-3 h-3 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-foreground/80"
 style={{ width: `${m.entryDifficultyScore}%` }}
 />
 </div>
 <p className="mt-1 text-right text-xs text-muted-foreground">
 {m.entryDifficultyScore}/100
 </p>
 </div>

 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="text-sm font-semibold text-foreground">Revenue Distribution</p>
 <p className="mt-1 text-xs text-muted-foreground">
 Top 10 by Best Sellers rank · bar width vs top earner
 </p>
 <ul className="mt-4 space-y-2">
 {products.map((p) => {
 const pct = (p.estimatedMonthlyRevenue / maxRev) * 100;
 return (
 <li key={p.asin + p.rank} className="flex items-center gap-2 text-sm">
 <span className="w-6 shrink-0 text-xs font-bold text-muted-foreground">
 #{p.rank}
 </span>
 <span className="min-w-0 flex-1 truncate text-xs text-foreground">
 {p.title}
 </span>
 <div className="hidden min-w-0 flex-[2] sm:block">
 <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-primary/80"
 style={{ width: `${pct}%` }}
 />
 </div>
 </div>
 <span className="shrink-0 text-xs font-semibold text-emerald-700">
 {formatRevenue(p.estimatedMonthlyRevenue)}
 </span>
 </li>
 );
 })}
 </ul>
 </div>

 <div className="flex justify-center">
 <span
 className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${comp.className}`}
 >
 {comp.label}
 </span>
 </div>
 </div>
 );
}
