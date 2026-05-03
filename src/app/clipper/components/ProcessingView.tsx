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
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-black">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          {errorMessage ?? "Processing failed. Try another video."}
        </p>
        <button
          type="button"
          onClick={onTryAgain}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
        >
          Try Another Video
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold leading-snug text-black">
            {title || "Your video"}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Processing for {timeStr}
            {stillProcessingHint ? (
              <span className="mt-1 block text-xs text-neutral-500">
                Still processing… transcription can take a while for longer videos.
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
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
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : active
                          ? "border-primary bg-white text-primary"
                          : "border-neutral-200 bg-white text-neutral-400")
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
                        ? "bg-emerald-400"
                        : "bg-neutral-200")
                    }
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 pt-1">
                <p
                  className={
                    "text-sm font-semibold " +
                    (active ? "text-black" : done ? "text-neutral-900" : "text-neutral-500")
                  }
                >
                  {clipLabel}
                </p>
                {active && isClipStep ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Clips may show as preview thumbnails when automatic cutting isn&apos;t
                    available on this host.
                  </p>
                ) : null}
                {active && i === 1 ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Whisper is transcribing your audio (often 2–5 minutes for long videos).
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {pollWarn ? (
        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
          ⏱ Transcription takes 2-5 minutes for longer videos. We&apos;ll process everything in
          the background — you can leave this page and come back.
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          ⏱ Transcription takes 2-5 minutes for longer videos. We&apos;ll process everything in
          the background — you can leave this page and come back.
        </div>
      )}
    </section>
  );
}
