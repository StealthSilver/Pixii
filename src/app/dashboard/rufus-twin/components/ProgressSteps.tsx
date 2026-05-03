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
      <ol className="space-y-2 rounded-lg border border-border bg-card/80 px-3 py-3 text-sm">
        {STEPS.map((label, i) => {
          const isStep1 = i === 0;
          const parallelGroup = i >= 1;
          let done = false;
          let running = false;
          let pending = false;

          if (active) {
            if (isStep1) {
              done = step1Complete;
              running = !step1Complete;
              pending = false;
            } else if (parallelGroup) {
              if (!step1Complete) {
                pending = true;
              } else {
                running = true;
              }
            }
          }

          return (
            <li key={label} className="flex items-center gap-2 text-foreground/90">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                {done ? (
                  <FaCheck className="size-3 text-emerald-600" aria-hidden />
                ) : running ? (
                  <FaSpinner
                    className="size-3 animate-spin text-primary"
                    aria-hidden
                  />
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
