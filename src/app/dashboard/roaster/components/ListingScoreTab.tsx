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

function arcStrokeClass(score: number): string {
  const t = scoreTone(score);
  if (t === "good") {
    return "stroke-emerald-600 dark:stroke-emerald-400";
  }
  if (t === "mid") {
    return "stroke-amber-600 dark:stroke-amber-400";
  }
  return "stroke-red-600 dark:stroke-red-400";
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
  const arcClass = arcStrokeClass(overall);

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
      label: "Bullet points",
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

  const card =
    "rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]";

  return (
    <div className="space-y-6">
      <section className={`${card} p-6`}>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          <div className="relative flex size-36 items-center justify-center">
            <svg className="size-36 -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                className="stroke-border"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                className={arcClass}
                strokeWidth="10"
                strokeDasharray={`${dash} ${c}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-heading text-4xl font-bold ${formatScore(overall)}`}>
                {overall}
              </span>
              <span className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-heading text-sm font-bold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                {listingScore.letterGrade}
              </span>
            </div>
          </div>
          <div className="max-w-md text-center sm:text-left">
            <p className="font-heading text-lg font-semibold text-foreground">
              Overall listing score
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimated conversion rate:{" "}
              <span className="font-semibold">
                {listingScore.conversionEstimate || "—"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Industry average: 3–5% for well-optimized listings
            </p>
          </div>
        </div>
      </section>

      <section className={`${card} p-5`}>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Score breakdown
        </h3>
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.key}>
              <button
                type="button"
                onClick={() => setOpen((k) => (k === row.key ? null : row.key))}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-foreground">{row.label}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${formatScore(row.score)}`}>
                    {row.score}/100
                  </span>
                </span>
              </button>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10 dark:bg-foreground/[0.08]">
                <div
                  className={`h-full rounded-full ${barClass(row.score)}`}
                  style={{ width: `${Math.min(100, row.score)}%` }}
                />
              </div>
              {open === row.key && row.issues.length > 0 ? (
                <ul className="mt-2 space-y-1 rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-200">
                  {row.issues.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200/90 bg-emerald-50/60 p-5 shadow-sm ring-1 ring-black/[0.03] dark:border-emerald-500/30 dark:bg-emerald-950/25 dark:ring-white/[0.05]">
        <h3 className="font-heading text-lg font-semibold text-emerald-950 dark:text-emerald-100">
          Quick wins — do these first
        </h3>
        <ol className="mt-4 space-y-3">
          {(listingScore.quickWins.length ? listingScore.quickWins : ["", "", ""])
            .slice(0, 3)
            .map((text, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-emerald-200/80 bg-card/90 p-3 shadow-sm dark:border-emerald-500/25 dark:bg-card/80"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm ring-1 ring-black/10 dark:bg-emerald-500 dark:ring-white/10">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{text || "—"}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                    High impact
                  </p>
                </div>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
