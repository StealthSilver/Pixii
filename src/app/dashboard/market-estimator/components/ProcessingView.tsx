"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";

const ROTATING = [
 "Counting how many sellers are printing money in this niche...",
 "Calculating how saturated this market really is...",
 "Asking Claude if this market is worth entering...",
 "Running the numbers on 10 competitors...",
 "Estimating monthly revenue to the nearest dollar...",
 "Almost ready to reveal the market size...",
] as const;

const STEPS = [
 {
 title: "Scraping Best Sellers page",
 active: "Reading top 10 products, prices, ratings and reviews...",
 },
 {
 title: "Estimating monthly revenue",
 active: "Applying sales rank formula to each product...",
 },
 {
 title: "Analyzing the market",
 active: "Claude is identifying opportunities and trends...",
 },
 {
 title: "Finalizing results",
 active: "Preparing your market dashboard...",
 },
] as const;

type ProcessingViewProps = {
 category: string;
 status: string;
 currentStep: number;
 errorMessage: string | null;
 elapsedSec: number;
 onTryAgain: () => void;
};

export function ProcessingView({
 category,
 status,
 currentStep,
 errorMessage,
 elapsedSec,
 onTryAgain,
}: ProcessingViewProps) {
 const [msgIdx, setMsgIdx] = useState(0);

 useEffect(() => {
 const id = window.setInterval(() => {
 setMsgIdx((i) => (i + 1) % ROTATING.length);
 }, 6000);
 return () => window.clearInterval(id);
 }, []);

 const progressPct =
 status === "complete"
 ? 100
 : Math.min(100, (Math.max(1, Math.min(currentStep || 1, 4)) / 4) * 100);

 const mm = Math.floor(elapsedSec / 60);
 const ss = elapsedSec % 60;
 const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;

 if (status === "failed") {
 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
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
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 {category ? (
 <p className="mb-4 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 Category: {category}
 </p>
 ) : null}

 <p className="text-sm text-muted-foreground">
 Researching for {timeStr}…
 </p>
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
 const done =
 status === "complete" || (currentStep ?? 1) > stepNum;
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

 <p className="mt-4 text-[11px] text-muted-foreground">
 * Estimates based on Best Sellers Rank position. For directional research only.
 </p>
 </section>
 );
}
