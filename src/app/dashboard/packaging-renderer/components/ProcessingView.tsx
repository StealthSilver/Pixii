"use client";

import type { PackageShape } from "@/lib/models/packagingJobEnums";
import { SHAPE_LABELS } from "./UploadZone";

type ProcessingViewProps = {
  filename: string | null;
  packageShape: PackageShape;
  status: string;
  currentStep: number;
  renderEngine: string | null;
  errorMessage: string | null;
  elapsedSec: number;
  pollWarn: boolean;
  onTryAgain: () => void;
  onRefreshStatus: () => void;
};

function CheckIcon() {
  return (
    <svg className="size-3.5 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6l3 3 5-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProcessingView({
  filename,
  packageShape,
  status,
  currentStep,
  renderEngine,
  errorMessage,
  elapsedSec,
  pollWarn,
  onTryAgain,
  onRefreshStatus,
}: ProcessingViewProps) {
  const shapeLabel = SHAPE_LABELS[packageShape] ?? packageShape;

  const step1Done =
    status === "rendering" ||
    status === "complete" ||
    (status === "failed" && currentStep >= 2);
  const step1Active = status === "extracting";
  const step2Active = status === "rendering";
  const step2Done = status === "complete";

  const progressPct =
    status === "complete"
      ? 100
      : step1Done && !step2Done
        ? 50
        : step2Done
          ? 100
          : step1Active
            ? 25
            : 0;

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
          We couldn&apos;t finish your renders. You can try again with a different file or settings.
        </p>
        {errorMessage ? (
          <details className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
            <summary className="cursor-pointer font-semibold text-foreground">
              Technical details
            </summary>
            <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-800">
              {errorMessage}
            </p>
          </details>
        ) : null}
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
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Processing
      </h2>
      {filename ? (
        <p className="mt-2 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {filename}
        </p>
      ) : null}

      <div className="relative mt-8 flex gap-4">
        <div className="flex flex-1 flex-col items-center gap-3">
          <div
            className={
              "flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold " +
              (step1Done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : step1Active
                  ? "border-primary bg-card text-primary"
                  : "border-border bg-card text-muted-foreground/75")
            }
          >
            {step1Done ? (
              <CheckIcon />
            ) : step1Active ? (
              <span
                className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
            ) : (
              "1"
            )}
          </div>
          <div className="text-center">
            <p
              className={
                "text-sm font-semibold " +
                (step1Active ? "text-foreground" : "text-foreground/90")
              }
            >
              Extracting artwork from PDF
            </p>
            {step1Active ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Working…</p>
            ) : null}
          </div>
        </div>

        <div className="relative flex flex-1 flex-col items-center gap-3 pt-5">
          <div
            className={
              "absolute left-[-50%] top-5 hidden h-0.5 w-[calc(100%+1rem)] sm:block " +
              (step1Done ? "bg-emerald-500" : "bg-border")
            }
            aria-hidden
          />
          <div
            className={
              "flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold " +
              (step2Done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : step2Active
                  ? "border-primary bg-card text-primary"
                  : "border-border bg-card text-muted-foreground/75")
            }
          >
            {step2Done ? (
              <CheckIcon />
            ) : step2Active ? (
              <span
                className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
            ) : (
              "2"
            )}
          </div>
          <div className="text-center">
            <p
              className={
                "text-sm font-semibold " +
                (step2Active ? "text-foreground" : "text-foreground/90")
              }
            >
              Generating 3D renders with AI
            </p>
            {step2Active ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Working…</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Processing for {timeStr}…
        </p>
      </div>

      {step2Active || step2Done ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {renderEngine === "fal" ? (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900">
              Using FAL.AI
            </span>
          ) : null}
          {renderEngine === "replicate" ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              Using Replicate
            </span>
          ) : null}
          {status === "rendering" && !renderEngine ? (
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground/90">
              Preparing render…
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        We&apos;re wrapping your artwork onto a 3D {shapeLabel.toLowerCase()}{" "}
        model.
      </p>

      {pollWarn ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p>This is taking longer than expected.</p>
          <button
            type="button"
            onClick={onRefreshStatus}
            className="mt-2 text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Refresh status
          </button>
        </div>
      ) : null}
    </section>
  );
}
