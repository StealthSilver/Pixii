"use client";

import { useCallback, useMemo, useState } from "react";
import { FaCheck, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import type { MarketIntelDto, ReviewListingRow } from "./types";
import { ReviewBrowser } from "./ReviewBrowser";

function barClass(score: number): string {
  if (score >= 70) {
    return "bg-emerald-500";
  }
  if (score >= 50) {
    return "bg-amber-500";
  }
  return "bg-red-500";
}

type Props = {
  intel: MarketIntelDto;
  jobId: string;
  listings: ReviewListingRow[];
};

export function ReviewThemesTab({ intel, jobId, listings }: Props) {
  const score = intel.marketSentimentScore ?? 0;
  const sub =
    score >= 70
      ? "Customers are generally satisfied"
      : score >= 50
        ? "Mixed sentiment — room to differentiate"
        : "High dissatisfaction — big opportunity";

  const trend = (intel.reviewVelocityTrend ?? "stable").toLowerCase();
  const trendBadge =
    trend === "growing" ? (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
        📈 Growing market — increasing review volume
      </span>
    ) : trend === "declining" ? (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
        📉 Slowing market — decreasing review volume
      </span>
    ) : (
      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
        📊 Stable market — consistent review volume
      </span>
    );

  const [open, setOpen] = useState(false);
  const features = useMemo(
    () => (intel.topPraisedFeatures ?? []).slice(0, 5),
    [intel.topPraisedFeatures],
  );
  const complaints = useMemo(
    () => (intel.topComplaints ?? []).slice(0, 5),
    [intel.topComplaints],
  );
  const needs = intel.unmetNeeds ?? [];

  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            🌟 What Customers Love
          </h3>
          <ul className="mt-3 space-y-2">
            {features.map((f) => (
              <li
                key={f}
                className="flex gap-2 rounded-lg border border-emerald-200/80 border-l-4 border-l-emerald-500 bg-card px-3 py-2.5 text-sm text-foreground shadow-sm"
              >
                <FaCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">
            😤 What Customers Complain About
          </h3>
          <ul className="mt-3 space-y-2">
            {complaints.map((f) => (
              <li
                key={f}
                className="flex gap-2 rounded-lg border border-red-200/80 border-l-4 border-l-red-500 bg-card px-3 py-2.5 text-sm text-foreground shadow-sm"
              >
                <FaTimes className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm">
        <h3 className="font-heading text-sm font-semibold text-amber-950">
          💡 Unmet Needs — What Customers Wish Existed
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {needs.map((n) => (
            <span
              key={n}
              className="rounded-full border border-amber-300/80 bg-card px-3 py-1 text-xs font-medium text-amber-950 shadow-sm"
            >
              {n}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">
          Overall Market Sentiment: {Math.round(score)}/100
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-foreground/10">
          <div
            className={`h-full rounded-full ${barClass(score)}`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
        <div className="mt-4">
          <p className="text-xs font-medium text-foreground/90">Review Trend</p>
          <div className="mt-2">{trendBadge}</div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-muted/80 p-4">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between text-left font-heading text-sm font-semibold text-foreground"
        >
          Browse Raw Reviews
          {open ? (
            <FaChevronUp className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <FaChevronDown className="size-4 text-muted-foreground" aria-hidden />
          )}
        </button>
        {open ? (
          <div className="mt-4">
            <ReviewBrowser jobId={jobId} listings={listings} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
