import { FaCheck, FaSpinner } from "react-icons/fa";

const STEPS = [
  "Querying GPT-4o…",
  "Querying GPT-4o mini…",
  "Querying Gemini…",
  "Parsing responses…",
  "Generating recommendations…",
] as const;

type ProgressStepsProps = {
  active: boolean;
  /** 0-based index of the step currently in progress (spinner). */
  currentIndex: number;
  /** When true, all steps show a checkmark. */
  allComplete: boolean;
};

export function ProgressSteps({
  active,
  currentIndex,
  allComplete,
}: ProgressStepsProps) {
  if (!active && !allComplete) {
    return null;
  }
  return (
    <ol className="mt-3 space-y-2 rounded-xl border border-border/80 bg-card/90 px-3 py-3 text-sm shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      {STEPS.map((label, i) => {
        const done = allComplete || i < currentIndex;
        const running = active && !allComplete && i === currentIndex;
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
  );
}
