"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { HistoryStripItem } from "./types";

type HistoryViewProps = {
  items: HistoryStripItem[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
};

function competitionPill(level: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-100 text-emerald-900";
    case "medium":
      return "bg-amber-100 text-amber-900";
    case "high":
      return "bg-orange-100 text-orange-900";
    case "very_high":
      return "bg-red-100 text-red-900";
    default:
      return "bg-neutral-100 text-neutral-800";
  }
}

export function HistoryView({
  items,
  onView,
  onDelete,
  busyId,
}: HistoryViewProps) {
  if (!items.length) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-neutral-600">
          No analyses yet. Paste a Best Sellers URL to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-black">
        Analysis history
      </h2>
      <ul className="mt-4 divide-y divide-neutral-100">
        {items.map((h) => (
          <li
            key={h._id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-900">{h.category}</p>
              <p className="mt-0.5 truncate text-xs text-neutral-500" title={h.amazonUrl}>
                {h.amazonUrl}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-emerald-700">
                  {formatRevenue(h.marketAnalysis.totalMarketSizeMonthly)} / mo
                </span>
                <span className="text-neutral-600">
                  Opportunity {h.marketAnalysis.opportunityScore}/100
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${competitionPill(h.marketAnalysis.competitionLevel)}`}
                >
                  {h.marketAnalysis.competitionLevel.replace(/_/g, " ")}
                </span>
                <span className="text-neutral-500">
                  {h.createdAt ? formatRelativeTime(h.createdAt) : ""}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busyId === h._id}
                onClick={() => onView(h._id)}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
              >
                View Results
              </button>
              <button
                type="button"
                disabled={busyId === h._id}
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("Delete this analysis from history?")
                  ) {
                    onDelete(h._id);
                  }
                }}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
