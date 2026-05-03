"use client";

import Image from "next/image";
import { FaCheck, FaSpinner } from "react-icons/fa";

type ProcessingViewProps = {
 thumbnailUrl: string | null;
 productName: string;
 scriptStyle: string;
 platform: string;
 status: string;
 currentStep: number;
 errorMessage: string | null;
 elapsedSec: number;
 pollWarn: boolean;
 longWaitHint: boolean;
 onTryAgain: () => void;
};

const STEPS = [
 { label: "Analyzing your product", key: "analyzing" },
 { label: "Writing UGC script", key: "scripting" },
 { label: "Generating voiceover", key: "voiceover" },
 { label: "Creating video frames", key: "frames" },
 { label: "Assembling video", key: "assembling" },
 { label: "Finalizing", key: "finalize" },
] as const;

const ACTIVE_HINT: Record<string, (ctx: { scriptStyle: string }) => string> = {
 queued: () => "Starting analysis...",
 analyzing: () =>
 "Reading product details, benefits, and target audience...",
 scripting: ({ scriptStyle }) =>
 `Writing your ${scriptStyle.replace(/_/g, " ")} style script...`,
 voiceover: () => "Converting script to natural human voice...",
 frames: () => "Generating 4 authentic UGC-style frames...",
 assembling: () => "Combining frames and audio into final video...",
 complete: () => "Uploading and preparing your download...",
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
 thumbnailUrl,
 productName,
 scriptStyle,
 platform,
 status,
 currentStep,
 errorMessage,
 elapsedSec,
 pollWarn,
 longWaitHint,
 onTryAgain,
}: ProcessingViewProps) {
 const eff = effectiveStep(status, currentStep);
 const progressPct =
 status === "complete" ? 100 : Math.min(100, (eff / 6) * 100);

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
 {errorMessage ?? "Processing failed. Try again."}
 </p>
 <button
 type="button"
 onClick={onTryAgain}
 className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 dark:ring-white/15"
 >
 Try again
 </button>
 </section>
 );
 }

 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative size-[60px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
 {thumbnailUrl ? (
 <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 {productName || "Your product"}
 </h2>
 <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
 <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium">
 {scriptStyle.replace(/_/g, " ")}
 </span>
 <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-medium">
 {platform.replace(/_/g, " ")}
 </span>
 </div>
 </div>
 </div>

 <div className="mt-6 h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
 style={{ width: `${progressPct}%` }}
 />
 </div>

 <p className="mt-3 text-sm text-muted-foreground">
 Creating for {timeStr}...
 {longWaitHint ? (
 <span className="mt-1 block text-xs text-amber-800 dark:text-amber-200">
 This is taking longer than expected. Your video is still processing —
 check back in a few minutes.
 </span>
 ) : null}
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
 const hintFn = ACTIVE_HINT[status] ?? ACTIVE_HINT.analyzing;
 const hint =
 active && status !== "queued"
 ? hintFn({ scriptStyle })
 : "";

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
 "mt-1 w-px grow min-h-[12px] " +
 (done ? "bg-emerald-500/50 dark:bg-emerald-600/60" : "bg-border")
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
 {active && hint ? (
 <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
 ) : null}
 </div>
 </li>
 );
 })}
 </ol>

 {pollWarn ? (
 <p className="mt-4 text-xs text-muted-foreground">
 Your video is being created. This takes 3-5 minutes. You can leave
 this page — we&apos;ll save your result.
 </p>
 ) : null}
 </section>
 );
}
