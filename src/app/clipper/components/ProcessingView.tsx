"use client";

import Image from "next/image";
import { FaCheck, FaSpinner } from "react-icons/fa";

type ProcessingViewProps = {
 thumbnailUrl: string | null;
 title: string;
 status: string;
 currentStep: number;
 completedClips: number;
 totalClips: number;
 errorMessage: string | null;
 elapsedSec: number;
 pollWarn: boolean;
 stillProcessingHint: boolean;
 onTryAgain: () => void;
};

const STEPS = [
 "Downloading video audio",
 "Transcribing with Whisper AI",
 "Identifying viral moments",
 "Cutting clips",
 "Writing SEO blog post",
] as const;

export function ProcessingView({
 thumbnailUrl,
 title,
 status,
 currentStep,
 completedClips,
 totalClips,
 errorMessage,
 elapsedSec,
 pollWarn,
 stillProcessingHint,
 onTryAgain,
}: ProcessingViewProps) {
 const effStep =
 status === "complete"
 ? 6
 : status === "queued"
 ? 1
 : Math.max(1, Math.min(currentStep || 1, 5));

 const progressPct =
 status === "complete" ? 100 : Math.min(100, ((effStep || 1) / 5) * 100);

 const mm = Math.floor(elapsedSec / 60);
 const ss = elapsedSec % 60;
 const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;

 if (status === "failed") {
 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Something went wrong
 </h2>
 <p className="mt-2 text-sm text-muted-foreground">
 {errorMessage ?? "Processing failed. Try another video."}
 </p>
 <button
 type="button"
 onClick={onTryAgain}
 className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 dark:ring-white/15"
 >
 Try Another Video
 </button>
 </section>
 );
 }

 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <div className="flex gap-4">
 <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 {thumbnailUrl ? (
 <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">
 {title || "Your video"}
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Processing for {timeStr}
 {stillProcessingHint ? (
 <span className="mt-1 block text-xs text-muted-foreground">
 Still processing… transcription can take a while for longer videos.
 </span>
 ) : null}
 </p>
 </div>
 </div>

 <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
 <div
 className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
 style={{ width: `${progressPct}%` }}
 />
 </div>

 <ol className="relative mt-8 space-y-0">
 {STEPS.map((label, i) => {
 const stepNum = i + 1;
 const done =
 status === "complete" || effStep > stepNum || (status === "complete" && stepNum <= 5);
 const active =
 status !== "complete" &&
 effStep === stepNum &&
 status !== "failed";
 const isClipStep = i === 3;
 const clipLabel =
 isClipStep && totalClips > 0
 ? `${label} [${completedClips}/${totalClips} complete]`
 : label;

 return (
 <li key={label} className="relative flex gap-3 pb-8 last:pb-0">
 <div className="relative flex flex-col items-center">
 <div
 className={
 "z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold " +
 (done && status === "complete"
 ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600"
 : done
 ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600"
 : active
 ? "border-primary bg-card text-primary ring-1 ring-primary/20 dark:bg-card"
 : "border-border bg-card text-muted-foreground/75")
 }
 >
 {done ? (
 <FaCheck className="size-4" aria-hidden />
 ) : active ? (
 <FaSpinner className="size-4 animate-spin" aria-hidden />
 ) : (
 stepNum
 )}
 </div>
 {i < STEPS.length - 1 ? (
 <span
 className={
 "absolute left-1/2 top-10 z-0 h-[calc(100%-0.25rem)] w-0.5 -translate-x-1/2 " +
 (effStep > stepNum || status === "complete"
 ? "bg-emerald-500/60 dark:bg-emerald-600/70"
 : "bg-border")
 }
 aria-hidden
 />
 ) : null}
 </div>
 <div className="min-w-0 pt-1">
 <p
 className={
 "text-sm font-semibold " +
 (active ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground")
 }
 >
 {clipLabel}
 </p>
 {active && isClipStep ? (
 <p className="mt-1 text-xs text-muted-foreground">
 Clips may show as preview thumbnails when automatic cutting isn&apos;t
 available on this host.
 </p>
 ) : null}
 {active && i === 1 ? (
 <p className="mt-1 text-xs text-muted-foreground">
 Whisper is transcribing your audio (often 2–5 minutes for long videos).
 </p>
 ) : null}
 </div>
 </li>
 );
 })}
 </ol>

 {pollWarn ? (
 <div className="mt-4 rounded-lg border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-100">
 Transcription takes 2-5 minutes for longer videos. We&apos;ll process everything in
 the background — you can leave this page and come back.
 </div>
 ) : (
 <div className="mt-4 rounded-lg border border-border bg-muted/80 px-4 py-3 text-sm text-foreground/90 ring-1 ring-black/[0.04] dark:bg-muted/50 dark:ring-white/[0.06]">
 Transcription takes 2-5 minutes for longer videos. We&apos;ll process everything in
 the background — you can leave this page and come back.
 </div>
 )}
 </section>
 );
}
