"use client";

import Image from "next/image";
import { FaCheck, FaSpinner } from "react-icons/fa";

type ProcessingViewProps = {
 productTitle: string;
 productThumbUrl: string | null;
 lifestyleLabel: string;
 status: string;
 errorMessage: string | null;
 elapsedSeconds: number;
 onTryAgain: () => void;
 /** Client-side max poll exceeded */
 timedOut?: boolean;
};

export function ProcessingView({
 productTitle,
 productThumbUrl,
 lifestyleLabel,
 status,
 errorMessage,
 elapsedSeconds,
 onTryAgain,
 timedOut = false,
}: ProcessingViewProps) {
 const failed = status === "failed" || timedOut;
 const failMessage = timedOut
 ? "Photo generation timed out. Please try again."
 : errorMessage;
 const step1Done =
 status === "generating" || status === "complete" || status === "pushed" || failed;
 const step2Done = status === "complete" || status === "pushed";
 const step1Active = status === "analyzing" || status === "queued";
 const step2Active = status === "generating";

 const progress =
 failed ? 0 : step2Done ? 100 : step1Done ? 50 : status === "queued" ? 5 : 25;

 const fmt = (s: number) => {
 const m = Math.floor(s / 60);
 const r = s % 60;
 return `${m}:${r.toString().padStart(2, "0")}`;
 };

 return (
 <section className="mt-4 max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center gap-3 border-b border-border/55 pb-4">
 <div className="relative size-[60px] shrink-0 overflow-hidden rounded-lg bg-foreground/10">
 {productThumbUrl ? (
 <Image src={productThumbUrl} alt="" fill sizes="60px" className="object-cover" />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate font-heading text-sm font-semibold text-foreground">{productTitle}</p>
 <p className="mt-1 text-xs font-medium text-muted-foreground">{lifestyleLabel}</p>
 </div>
 </div>

 {failed ? (
 <div className="mt-5 space-y-4">
 <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
 {failMessage ?? "Something went wrong."}
 </p>
 <button
 type="button"
 onClick={() => onTryAgain()}
 className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
 >
 Try Again
 </button>
 </div>
 ) : (
 <>
 <ol className="mt-5 space-y-3 rounded-lg border border-border bg-card/80 px-3 py-3 text-sm">
 <li className="flex items-start gap-3 text-foreground/90">
 <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold">
 {step1Done && !step1Active ? (
 <FaCheck className="size-3.5 text-emerald-600" aria-hidden />
 ) : step1Active ? (
 <FaSpinner className="size-3.5 animate-spin text-primary" aria-hidden />
 ) : (
 "1"
 )}
 </span>
 <div className="flex-1">
 <p className={step1Done ? "font-medium text-foreground" : ""}>
 Analyzing product & crafting AI prompt
 </p>
 {step1Active ? (
 <p className="mt-1 text-xs text-muted-foreground">
 Working… Reading your product details and building the perfect photography
 prompt...
 </p>
 ) : null}
 </div>
 </li>
 <li className="flex items-start gap-3 text-foreground/90">
 <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold">
 {step2Done ? (
 <FaCheck className="size-3.5 text-emerald-600" aria-hidden />
 ) : step2Active ? (
 <FaSpinner className="size-3.5 animate-spin text-primary" aria-hidden />
 ) : (
 "2"
 )}
 </span>
 <div className="flex-1">
 <p className={step2Done ? "font-medium text-foreground" : ""}>
 Generating 4 lifestyle photos
 </p>
 {step2Active ? (
 <p className="mt-1 text-xs text-muted-foreground">
 Working… Your lifestyle photos are being generated. This takes about 30–40
 seconds...
 </p>
 ) : null}
 </div>
 </li>
 </ol>

 <div className="mt-4">
 <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
 style={{ width: `${progress}%` }}
 />
 </div>
 <p className="mt-2 text-left text-xs text-muted-foreground">
 Generating for {fmt(elapsedSeconds)}...
 </p>
 </div>
 </>
 )}
 </section>
 );
}
