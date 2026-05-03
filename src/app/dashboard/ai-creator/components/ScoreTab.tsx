"use client";

import type { ListingAnalysis } from "@/lib/aiCreator/types";

function scoreTone(score: number): "good" | "mid" | "bad" {
 if (score >= 70) {
 return "good";
 }
 if (score >= 40) {
 return "mid";
 }
 return "bad";
}

function ringStroke(score: number): string {
 const t = scoreTone(score);
 if (t === "good") {
 return "#059669";
 }
 if (t === "mid") {
 return "#d97706";
 }
 return "#dc2626";
}

function letterGrade(score: number): string {
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

function barClass(score: number): string {
 const t = scoreTone(score);
 if (t === "good") {
 return "bg-emerald-500";
 }
 if (t === "mid") {
 return "bg-amber-500";
 }
 return "bg-red-500";
}

type ScoreTabProps = {
 analysis: ListingAnalysis | null | undefined;
};

export function ScoreTab({ analysis }: ScoreTabProps) {
 const overall = analysis?.overallScore ?? 0;
 const r = 52;
 const c = 2 * Math.PI * r;
 const pct = Math.min(100, Math.max(0, overall)) / 100;
 const dash = c * pct;
 const roughCv = (overall / 10).toFixed(1);

 const rows = [
 { label: "Title Score", v: analysis?.titleScore ?? 0 },
 { label: "Bullet Points", v: analysis?.bulletScore ?? 0 },
 { label: "Images", v: analysis?.imageScore ?? 0 },
 { label: "Description", v: analysis?.descriptionScore ?? 0 },
 { label: "Pricing", v: analysis?.priceScore ?? 0 },
 ];

 return (
 <div className="space-y-6">
 <section className="rounded-xl border border-border/80 bg-card/95 p-6 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
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
 stroke="currentColor"
 className="text-border"
 strokeWidth="10"
 />
 <circle
 cx="60"
 cy="60"
 r={r}
 fill="none"
 stroke={ringStroke(overall)}
 strokeWidth="10"
 strokeDasharray={`${dash} ${c}`}
 strokeLinecap="round"
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="font-heading text-4xl font-bold text-foreground">
 {overall}
 </span>
 <span className="text-xs font-semibold text-muted-foreground">
 Overall score
 </span>
 </div>
 </div>
 <div className="max-w-md text-center sm:text-left">
 <div className="flex flex-wrap items-end justify-center gap-3 sm:justify-start">
 <p className="font-heading text-2xl font-semibold text-foreground">
 Listing scorecard
 </p>
 <span className="rounded-lg border border-border bg-muted px-2.5 py-1 font-heading text-xl font-bold text-foreground">
 {letterGrade(overall)}
 </span>
 </div>
 <p className="mt-2 text-sm text-muted-foreground">
 Your listing converts at roughly{" "}
 <span className="font-semibold">{roughCv}%</span> — rough
 estimate only; industry average is often cited around 3–5%.
 </p>
 </div>
 </div>
 </section>

 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <h3 className="font-heading text-lg font-semibold text-foreground">
 Score breakdown
 </h3>
 <div className="mt-4 space-y-4">
 {rows.map((row) => (
 <div key={row.label}>
 <div className="flex justify-between text-sm">
 <span className="font-medium text-foreground">
 {row.label}
 </span>
 <span className="font-semibold text-foreground">{row.v}/100</span>
 </div>
 <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className={`h-full rounded-full ${barClass(row.v)}`}
 style={{ width: `${Math.min(100, row.v)}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </section>

 <div className="grid gap-4 lg:grid-cols-2">
 <section>
 <h3 className="font-heading text-base font-semibold text-foreground">
 Conversion killers 
 </h3>
 <ul className="mt-3 space-y-2">
 {(analysis?.conversionKillers ?? []).map((t, i) => (
 <li
 key={i}
 className="flex gap-2 rounded-lg border border-red-200/90 bg-red-50/80 px-3 py-2 text-sm text-red-950 dark:border-red-500/30 dark:bg-red-950/25 dark:text-red-100"
 >
 <svg
 className="mt-0.5 size-4 shrink-0 text-red-600"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 aria-hidden
 >
 <path d="M18 6L6 18M6 6l12 12" />
 </svg>
 <span>{t}</span>
 </li>
 ))}
 </ul>
 </section>
 <section>
 <h3 className="font-heading text-base font-semibold text-foreground">
 What&apos;s working 
 </h3>
 <ul className="mt-3 space-y-2">
 {(analysis?.strengths ?? []).map((t, i) => (
 <li
 key={i}
 className="flex gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/25 dark:text-emerald-100"
 >
 <svg
 className="mt-0.5 size-4 shrink-0 text-emerald-600"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 aria-hidden
 >
 <path d="M20 6L9 17l-5-5" />
 </svg>
 <span>{t}</span>
 </li>
 ))}
 </ul>
 </section>
 </div>

 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <h3 className="font-heading text-lg font-semibold text-foreground">
 Keywords you&apos;re missing
 </h3>
 <div className="mt-3 flex flex-wrap gap-2">
 {(analysis?.missedKeywords ?? []).map((k, i) => (
 <span
 key={i}
 className="inline-flex items-center gap-1 rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
 >
 <span aria-hidden>+</span>
 {k}
 </span>
 ))}
 </div>
 <p className="mt-3 text-xs text-muted-foreground">
 Consider adding these to your title, bullets, or description.
 </p>
 </section>
 </div>
 );
}
