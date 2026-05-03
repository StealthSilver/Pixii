"use client";

import { useEffect, useState } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { PERSONAS } from "@/lib/aiCreator/personas";
import type { InfluencerPersonaId } from "@/lib/aiCreator/personas";

const STEPS = [
  { key: "scraping", label: "Scraping Amazon listing" },
  { key: "analyzing", label: "Analyzing listing quality" },
  { key: "scripting", label: "Writing roast script" },
  { key: "voiceover", label: "Generating voiceover" },
  { key: "avatar", label: "Creating AI avatar" },
  { key: "assembling", label: "Assembling video" },
  { key: "finalize", label: "Finalizing" },
] as const;

const ROTATING = [
  "Preparing the brutally honest truth...",
  "Counting how many keywords you missed...",
  "Our AI just said 'oh no' three times...",
  "Calculating exactly how much money you're leaving on the table...",
  "The influencer is warming up...",
  "Almost ready to roast...",
];

const STEP_HINT: Record<
  string,
  (ctx: { personaName: string }) => string
> = {
  scraping: () =>
    "Reading your listing title, bullets, images and description...",
  analyzing: () => "Scoring every element of your listing...",
  scripting: ({ personaName }) =>
    `Writing the ${personaName} style script...`,
  voiceover: () => "Converting script to voice...",
  avatar: () => "Generating the AI influencer avatar...",
  assembling: () => "Combining avatar video with audio...",
  queued: () => "Starting...",
  complete: () => "Preparing your results...",
};

function effectiveStep(status: string, currentStep: number): number {
  if (status === "complete") {
    return 7;
  }
  if (status === "failed") {
    return 0;
  }
  if (status === "queued") {
    return 1;
  }
  return Math.max(1, Math.min(currentStep || 1, 7));
}

type ProcessingViewProps = {
  asin: string;
  personaId: InfluencerPersonaId;
  status: string;
  currentStep: number;
  errorMessage: string | null;
  elapsedSec: number;
  onTryAgain: () => void;
};

export function ProcessingView({
  asin,
  personaId,
  status,
  currentStep,
  errorMessage,
  elapsedSec,
  onTryAgain,
}: ProcessingViewProps) {
  const persona = PERSONAS[personaId];
  const eff = effectiveStep(status, currentStep);
  const progressPct = status === "complete" ? 100 : (eff / 7) * 100;

  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    if (status === "failed" || status === "complete") {
      return;
    }
    const id = window.setInterval(() => {
      setMsgIdx((i) => (i + 1) % ROTATING.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [status]);

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
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
          ASIN {asin || "—"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/55 bg-muted/80 p-3">
        <span className="text-2xl" aria-hidden>
          {persona.emoji}
        </span>
        <div>
          <p className="font-heading text-sm font-bold text-foreground">
            {persona.name}
          </p>
          <p className="text-xs text-muted-foreground">{persona.handle}</p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Roasting for {timeStr}...
      </p>

      <p className="mt-2 text-xs italic text-muted-foreground">{ROTATING[msgIdx]}</p>

      <ol className="relative mt-8 space-y-0">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const done = status === "complete" || eff > stepNum;
          const active =
            status !== "complete" &&
            eff === stepNum &&
            status !== "failed" &&
            status !== "queued";

          const hintFn =
            STEP_HINT[step.key === "finalize" ? "complete" : step.key] ??
            STEP_HINT.scraping;
          const hint =
            active && status !== "queued"
              ? hintFn({ personaName: persona.name })
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
                {active && hint ? (
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
