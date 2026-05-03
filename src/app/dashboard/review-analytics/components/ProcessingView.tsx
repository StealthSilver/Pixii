"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";

const ROTATING = [
 "Reading what your customers actually care about...",
 "Counting how many times competitors get 1-star reviews...",
 "Identifying the features that drive 5-star ratings...",
 "Finding the gaps your competitors are leaving open...",
 "Almost done mining 1000+ customer opinions...",
 "Comparing your listing against 9 competitors...",
 "Discovering what makes shoppers click 'Add to Cart'...",
] as const;

const STEPS = [
 {
 title: "Scraping your listing & finding competitors",
 active: "Reading your product page and discovering up to 9 competitors...",
 },
 {
 title: "Scraping 1000+ customer reviews",
 active: "Pulling reviews from all 10 listings — this takes a moment...",
 },
 {
 title: "Estimating monthly revenue",
 active: "Calculating revenue estimates using Best Sellers Rank data...",
 },
 {
 title: "Running AI review analysis",
 active: "Claude is identifying purchase criteria and sentiment patterns...",
 },
 {
 title: "Finalizing your dashboard",
 active: "Preparing your competitive intelligence report...",
 },
] as const;

type ProcessingViewProps = {
 userAsin: string;
 status: string;
 currentStep: number;
 totalListingsScraped: number;
 totalReviewsScraped: number;
 errorMessage: string | null;
 elapsedSec: number;
 onTryAgain: () => void;
};

export function ProcessingView({
 userAsin,
 status,
 currentStep,
 totalListingsScraped,
 totalReviewsScraped,
 errorMessage,
 elapsedSec,
 onTryAgain,
}: ProcessingViewProps) {
 const [msgIdx, setMsgIdx] = useState(0);

 useEffect(() => {
 const id = window.setInterval(() => {
 setMsgIdx((i) => (i + 1) % ROTATING.length);
 }, 8000);
 return () => window.clearInterval(id);
 }, []);

 const progressPct =
 status === "complete"
 ? 100
 : Math.min(100, (Math.max(1, Math.min(currentStep || 1, 5)) / 5) * 100);

 const mm = Math.floor(elapsedSec / 60);
 const ss = elapsedSec % 60;
 const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;

 if (status === "failed") {
 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05] sm:p-5">
 <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
 Something went wrong
 </h2>
 <p className="mt-2 text-sm text-muted-foreground">
 {errorMessage ?? "Processing failed."}
 </p>
 <button
 type="button"
 onClick={onTryAgain}
 className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15"
 >
 Try again
 </button>
 </section>
 );
 }

 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05] sm:p-5">
 {userAsin ? (
 <p className="mb-4 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 ASIN: {userAsin}
 </p>
 ) : null}

 <p className="text-sm text-muted-foreground">Analyzing for {timeStr}…</p>
 <p className="mt-1 text-xs italic text-muted-foreground">{ROTATING[msgIdx]}</p>

 <div className="mt-5 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
 style={{ width: `${progressPct}%` }}
 />
 </div>

 <ol className="mt-6 space-y-3">
 {STEPS.map((step, i) => {
 const stepNum = i + 1;
 const done = status === "complete" || (currentStep ?? 1) > stepNum;
 const active =
 status !== "complete" &&
 status !== "failed" &&
 ((currentStep ?? 1) === stepNum ||
 (status === "queued" && stepNum === 1));
 return (
 <li
 key={step.title}
 className="rounded-lg border border-border/55 bg-muted/80 px-3 py-2.5 ring-1 ring-black/[0.02] dark:bg-muted/60 dark:ring-white/[0.04]"
 >
 <div className="flex items-start gap-2">
 <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
 {done ? (
 <FaCheck className="size-3 text-emerald-600" aria-hidden />
 ) : active ? (
 <FaSpinner className="size-3 animate-spin text-primary" aria-hidden />
 ) : (
 <span className="size-2 rounded-full bg-border" aria-hidden />
 )}
 </span>
 <div className="min-w-0 flex-1">
 <p
 className={`text-sm font-semibold ${done || active ? "text-foreground" : "text-muted-foreground"}`}
 >
 {step.title}
 </p>
 {active ? (
 <p className="mt-0.5 text-xs text-muted-foreground">{step.active}</p>
 ) : null}
 </div>
 </div>
 </li>
 );
 })}
 </ol>

 <div className="mt-4 flex flex-col gap-2 text-xs font-medium text-foreground/90 sm:flex-row sm:flex-wrap sm:gap-4">
 <span> {totalListingsScraped} / 10 listings scraped</span>
 <span> {totalReviewsScraped} reviews collected</span>
 </div>

 <p className="mt-4 text-[11px] text-muted-foreground">
 * Estimates use Best Sellers Rank. Directional only.
 </p>
 </section>
 );
}
