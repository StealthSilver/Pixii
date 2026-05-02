"use client";

import { useState } from "react";
import type { AeoHistorySummary } from "../types";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

function pill(score: number | null): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
  if (score === null || score === undefined) {
    return base + "border-neutral-200 bg-neutral-50 text-neutral-600";
  }
  if (score >= 70) {
    return base + "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (score >= 40) {
    return base + "border-amber-200 bg-amber-50 text-amber-900";
  }
  return base + "border-red-200 bg-red-50 text-red-900";
}

function overallBadge(score: number | null): string {
  return pill(score);
}

type HistoryListProps = {
  items: AeoHistorySummary[] | undefined;
  loading: boolean;
  error: Error | undefined;
  onView: (id: string) => void;
  onDeleted: () => void;
  onToast: (message: string, variant: "success" | "error") => void;
};

export function HistoryList({
  items,
  loading,
  error,
  onView,
  onDeleted,
  onToast,
}: HistoryListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
            className="animate-pulse rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="h-4 w-2/3 rounded bg-neutral-200" />
            <div className="mt-3 h-3 w-1/3 rounded bg-neutral-100" />
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-16 rounded-full bg-neutral-100" />
              <div className="h-6 w-16 rounded-full bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-white/60 px-6 py-10 text-center text-sm text-neutral-600">
        No diagnostics run yet. Switch to &ldquo;Run diagnostic&rdquo; and submit
        your first query.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((row) => (
        <li
          key={row._id}
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <p className="font-heading text-sm font-semibold text-black">
            {row.queryText}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{row.brandName}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={overallBadge(row.overallScore)}>
              Overall {row.overallScore ?? "—"}
            </span>
            <span className={pill(row.gptScore)}>GPT {row.gptScore ?? "—"}</span>
            <span className={pill(row.claudeScore)}>
              Mini {row.claudeScore ?? "—"}
            </span>
            <span className={pill(row.geminiScore)}>
              Gemini {row.geminiScore ?? "—"}
            </span>
            <span className="ml-auto text-xs text-neutral-500">
              {formatRelativeTime(row.createdAt)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onView(row._id)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            >
              View report
            </button>
            {confirmId === row._id ? (
              <span className="inline-flex items-center gap-2 text-xs text-neutral-700">
                Sure?
                <button
                  type="button"
                  className="rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-800"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/aeo/history/${row._id}`, {
                        method: "DELETE",
                      });
                      if (!res.ok) {
                        const b = (await res.json()) as { error?: string };
                        throw new Error(b.error ?? "Delete failed");
                      }
                      onToast("Diagnostic deleted", "success");
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
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1 font-semibold text-neutral-800"
                  onClick={() => setConfirmId(null)}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(row._id)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-black/[0.03]"
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
