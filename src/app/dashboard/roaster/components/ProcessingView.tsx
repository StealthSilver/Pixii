"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";

const ROTATING = [
 "Reading your listing with fresh eyes...",
 "Counting how many keywords you buried...",
 "Finding the bullet point that's hurting you most...",
 "Writing feedback your listing actually needs to hear...",
 "No sugarcoating happening here...",
 "Almost ready to deliver the verdict...",
 "Preparing your rewrite suggestions...",
] as const;

const STEPS = [
 {
 label: "Scraping your listing",
 active: "Reading your title, bullets, images and description...",
 },
 {
 label: "Scoring every element",
 active: "Grading your title, bullets, images, description and pricing...",
 },
 {
 label: "Writing the critique",
 active: "Drafting your direct no-fluff video script...",
 },
 {
 label: "Generating voiceover",
 active: "Converting critique to speech...",
 },
 {
 label: "Creating AI presenter",
 active: "Generating your video presenter...",
 },
 {
 label: "Finalizing",
 active: "Wrapping up your critique package...",
 },
] as const;

type ProcessingViewProps = {
 asinChip: string;
 status: string;
 currentStep: number;
 errorMessage: string | null;
 elapsedSec: number;
 onTryAgain: () => void;
};

function effectiveStep(status: string, currentStep: number): number {
 if (status === "complete") {
 return 6;
 }
 if (status === "failed") {
 return 0;
 }
 if (status === "queued") {
 return 1;
 }
 return Math.max(1, Math.min(currentStep || 1, 6));
}

export function ProcessingView({
 asinChip,
 status,
 currentStep,
 errorMessage,
 elapsedSec,
 onTryAgain,
}: ProcessingViewProps) {
 const eff = effectiveStep(status, currentStep);
 const progressPct = status === "complete" ? 100 : (eff / 6) * 100;
 const [rotateIdx, setRotateIdx] = useState(0);

 useEffect(() => {
 const id = window.setInterval(() => {
 setRotateIdx((i) => (i + 1) % ROTATING.length);
 }, 7000);
 return () => window.clearInterval(id);
 }, []);

 const mm = Math.floor(elapsedSec / 60);
 const ss = elapsedSec % 60;
 const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;

 if (status === "failed") {
 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Something went wrong
 </h2>
 <p className="mt-2 text-sm text-muted-foreground">
 {errorMessage ?? "Processing failed. Try again."}
 </p>
 <button
 type="button"
 onClick={onTryAgain}
 className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
 >
 Try Again
 </button>
 </section>
 );
 }

 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
 ASIN: {asinChip}
 </span>
 </div>

 <p className="mt-4 text-xs text-muted-foreground">{ROTATING[rotateIdx]}</p>

 <div className="mt-4 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
 style={{ width: `${progressPct}%` }}
 />
 </div>

 <p className="mt-3 text-sm text-muted-foreground">
 Working for {timeStr}...
 </p>

 <ol className="relative mt-8 space-y-0">
 {STEPS.map((step, i) => {
 const stepNum = i + 1;
 const done = status === "complete" || eff > stepNum;
 const active =
 status !== "complete" &&
 eff === stepNum &&
 status !== "failed" &&
 status !== "queued";

 return (
 <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
 <div className="flex flex-col items-center">
 <div
 className={
 "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold " +
 (done
 ? "border-emerald-500 bg-emerald-500 text-white"
 : active
 ? "border-primary bg-card text-primary"
 : "border-border bg-foreground/10 text-muted-foreground/75")
 }
 >
 {done ? (
 <FaCheck className="size-3.5" aria-hidden />
 ) : active ? (
 <FaSpinner className="size-3.5 animate-spin" aria-hidden />
 ) : (
 stepNum
 )}
 </div>
 {i < STEPS.length - 1 ? (
 <div
 className={
 "mt-1 min-h-[12px] w-px grow " +
 (done ? "bg-emerald-200" : "bg-border")
 }
 aria-hidden
 />
 ) : null}
 </div>
 <div className="min-w-0 pt-0.5">
 <p
 className={
 "text-sm font-semibold " +
 (active ? "text-foreground" : "text-foreground/90")
 }
 >
 {step.label}
 </p>
 {active ? (
 <p className="mt-1 text-xs text-muted-foreground">{step.active}</p>
 ) : null}
 </div>
 </li>
 );
 })}
 </ol>

 <p className="mt-4 text-xs text-muted-foreground">
 Your critique package is being built. This usually takes 3–5 minutes.
 </p>
 </section>
 );
}
