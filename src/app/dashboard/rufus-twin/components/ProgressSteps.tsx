"use client";

import { FaCheck, FaSpinner } from "react-icons/fa";

const STEPS = [
  "Analyzing your query…",
  "Simulating Rufus response…",
  "Identifying key ranking factors…",
  "Finding competitor insights…",
  "Generating listing recommendations…",
] as const;

type ProgressStepsProps = {
  active: boolean;
  /** After step 1 completes, steps 2–5 show as active together. */
  step1Complete: boolean;
  elapsedLabel: string;
};

export function ProgressSteps({
  active,
  step1Complete,
  elapsedLabel,
}: ProgressStepsProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <ol className="space-y-2 rounded-xl border border-border/80 bg-card/90 px-3 py-3 text-sm shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
        {STEPS.map((label, i) => {
          const isStep1 = i === 0;
          const parallelGroup = i >= 1;
          let done = false;
          let running = false;

          if (active) {
            if (isStep1) {
              done = step1Complete;
              running = !step1Complete;
            } else if (parallelGroup) {
              if (step1Complete) {
                running = true;
              }
            }
          }

          return (
            <li key={label} className="flex items-center gap-2 text-foreground/90">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
                {done ? (
                  <FaCheck
                    className="size-3 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                ) : running ? (
                  <FaSpinner className="size-3 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="size-2 rounded-full bg-border" aria-hidden />
                )}
              </span>
              <span className={done ? "font-medium text-foreground" : ""}>{label}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-muted-foreground">{elapsedLabel}</p>
    </div>
  );
}
