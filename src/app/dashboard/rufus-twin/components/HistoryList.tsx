"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type RufusHistoryRow = {
  _id: string;
  queryText: string;
  queryType: string;
  category: string;
  overallScore: number | null;
  createdAt: string;
};

const TYPE_BADGE: Record<string, string> = {
  product_recommendation:
    "border-blue-200/90 bg-blue-50 text-blue-900 dark:border-blue-500/35 dark:bg-blue-950/45 dark:text-blue-200",
  product_comparison:
    "border-purple-200/90 bg-purple-50 text-purple-900 dark:border-purple-500/35 dark:bg-purple-950/45 dark:text-purple-200",
  use_case:
    "border-teal-200/90 bg-teal-50 text-teal-900 dark:border-teal-500/35 dark:bg-teal-950/45 dark:text-teal-200",
  ingredient_question:
    "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200",
  concern_question:
    "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100",
  brand_question:
    "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-200",
};

function scorePill(score: number | null): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
  if (score === null || score === undefined) {
    return base + "border-border bg-muted text-muted-foreground";
  }
  if (score >= 70) {
    return (
      base +
      "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200"
    );
  }
  if (score >= 40) {
    return (
      base +
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
    );
  }
  return (
    base +
    "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200"
  );
}

const primaryBtn =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

const secondaryBtn =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

type HistoryListProps = {
  items: RufusHistoryRow[] | undefined;
  loading: boolean;
  error: Error | undefined;
  onView: (id: string) => void;
  onDeleted: () => void;
  onToast: (message: string, variant: "success" | "error") => void;
  onAskRufus: () => void;
};

export function HistoryList({
  items,
  loading,
  error,
  onView,
  onDeleted,
  onToast,
  onAskRufus,
}: HistoryListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200">
        {error.message}
      </p>
    );
  }

  if (loading && !items?.length) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border/80 bg-card/90 p-4 ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
          >
            <div className="h-4 w-2/3 rounded bg-border" />
            <div className="mt-3 h-3 w-1/3 rounded bg-foreground/10" />
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/70 px-6 py-12 text-center backdrop-blur-[1px]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-4 font-heading text-sm font-semibold text-foreground">
          No queries yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Run your first Rufus simulation from the Query tab.
        </p>
        <button type="button" onClick={onAskRufus} className={`${primaryBtn} mt-5`}>
          Ask Rufus
        </button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((row) => {
        const typeClass =
          TYPE_BADGE[row.queryType] ??
          "border-border bg-muted text-foreground";
        return (
          <li
            key={row._id}
            className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]"
          >
            <p className="line-clamp-2 font-heading text-sm font-semibold text-foreground">
              {row.queryText}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={
                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
                  typeClass
                }
              >
                {row.queryType.replace(/_/g, " ")}
              </span>
              {row.category ? (
                <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {row.category}
                </span>
              ) : null}
              {row.overallScore !== null ? (
                <span className={scorePill(row.overallScore)}>
                  Score {row.overallScore}
                </span>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatRelativeTime(row.createdAt)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onView(row._id)}
                className={primaryBtn}
              >
                View
              </button>
              {confirmId === row._id ? (
                <span className="inline-flex items-center gap-2 text-xs text-foreground/90">
                  Sure?
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-2 py-1 font-semibold text-white shadow-sm ring-1 ring-black/15 hover:bg-red-700 dark:ring-white/10"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/rufus-twin/history/${row._id}`,
                          { method: "DELETE" },
                        );
                        if (!res.ok) {
                          const b = (await res.json()) as { error?: string };
                          throw new Error(b.error ?? "Delete failed");
                        }
                        onToast("Query deleted", "success");
                        setConfirmId(null);
                        onDeleted();
                      } catch (e) {
                        onToast(
                          e instanceof Error ? e.message : "Delete failed",
                          "error",
                        );
                      }
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => setConfirmId(null)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(row._id)}
                  className={secondaryBtn}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
