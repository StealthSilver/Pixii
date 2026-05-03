"use client";

import { useState } from "react";
import type { RoasterJobView } from "./types";
import { formatScore } from "@/lib/roaster/formatScore";

function scoreTone(score: number): "good" | "mid" | "bad" {
  if (score >= 70) {
    return "good";
  }
  if (score >= 40) {
    return "mid";
  }
  return "bad";
}

function ringStroke(score: number): string {
  const t = scoreTone(score);
  if (t === "good") {
    return "#059669";
  }
  if (t === "mid") {
    return "#d97706";
  }
  return "#dc2626";
}

function barClass(score: number): string {
  const t = scoreTone(score);
  if (t === "good") {
    return "bg-emerald-500";
  }
  if (t === "mid") {
    return "bg-amber-500";
  }
  return "bg-red-500";
}

type RowKey = "title" | "bullet" | "image" | "description" | "pricing";

type ListingScoreTabProps = {
  job: RoasterJobView;
};

export function ListingScoreTab({ job }: ListingScoreTabProps) {
  const { listingScore } = job;
  const overall = listingScore.overallScore;
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, overall)) / 100;
  const dash = c * pct;

  const [open, setOpen] = useState<RowKey | null>(null);

  const rows: {
    key: RowKey;
    label: string;
    score: number;
    issues: string[];
  }[] = [
    {
      key: "title",
      label: "Title",
      score: listingScore.titleScore,
      issues: listingScore.titleIssues,
    },
    {
      key: "bullet",
      label: "Bullet Points",
      score: listingScore.bulletScore,
      issues: listingScore.bulletIssues,
    },
    {
      key: "image",
      label: "Images",
      score: listingScore.imageScore,
      issues: listingScore.imageIssues,
    },
    {
      key: "description",
      label: "Description",
      score: listingScore.descriptionScore,
      issues: listingScore.descriptionIssues,
    },
    {
      key: "pricing",
      label: "Pricing",
      score: listingScore.pricingScore,
      issues: listingScore.pricingIssues,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          <div className="relative flex size-36 items-center justify-center">
            <svg
              className="size-36 -rotate-90"
              viewBox="0 0 120 120"
              aria-hidden
            >
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={ringStroke(overall)}
                strokeWidth="10"
                strokeDasharray={`${dash} ${c}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-heading text-4xl font-bold ${formatScore(overall)}`}>
                {overall}
              </span>
              <span className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-heading text-sm font-bold text-black">
                {listingScore.letterGrade}
              </span>
            </div>
          </div>
          <div className="max-w-md text-center sm:text-left">
            <p className="font-heading text-lg font-semibold text-black">
              Overall listing score
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Estimated conversion rate:{" "}
              <span className="font-semibold">
                {listingScore.conversionEstimate || "—"}
              </span>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Industry average: 3–5% for well-optimized listings
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="font-heading text-lg font-semibold text-black">
          Score breakdown
        </h3>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.key}>
              <button
                type="button"
                onClick={() =>
                  setOpen((k) => (k === row.key ? null : row.key))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-neutral-800">
                  {row.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${formatScore(row.score)}`}>
                    {row.score}/100
                  </span>
                  <span className="text-neutral-400" aria-hidden>
                    ▼
                  </span>
                </span>
              </button>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full ${barClass(row.score)}`}
                  style={{ width: `${Math.min(100, row.score)}%` }}
                />
              </div>
              {open === row.key && row.issues.length > 0 ? (
                <ul className="mt-2 space-y-1 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-900">
                  {row.issues.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
        <h3 className="font-heading text-lg font-semibold text-emerald-950">
          ⚡ Quick Wins — Do These First
        </h3>
        <ol className="mt-4 space-y-3">
          {(listingScore.quickWins.length
            ? listingScore.quickWins
            : ["", "", ""]
          )
            .slice(0, 3)
            .map((text, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-emerald-100 bg-white/80 p-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-900">{text || "—"}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    High Impact
                  </p>
                </div>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
