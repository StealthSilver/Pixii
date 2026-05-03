"use client";

import { useState } from "react";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { HistoryStripItem } from "./types";

type HistoryViewProps = {
  items: HistoryStripItem[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
};

function gradeBadgeClass(g: string): string {
  switch (g.toUpperCase()) {
    case "A":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "B":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200";
    case "C":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950/45 dark:text-amber-100";
    case "D":
      return "bg-orange-100 text-orange-900 dark:bg-orange-950/45 dark:text-orange-100";
    default:
      return "bg-red-100 text-red-900 dark:bg-red-950/45 dark:text-red-200";
  }
}

const primaryBtn =
  "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:opacity-60 dark:ring-white/15";

const deleteBtn =
  "rounded-lg border border-red-200/90 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-red-100 dark:border-red-500/40 dark:bg-red-950/35 dark:text-red-200 dark:hover:bg-red-950/55 dark:ring-white/[0.06]";

export function HistoryView({
  items,
  onView,
  onDelete,
  busyId,
}: HistoryViewProps) {
  if (!items.length) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/70 px-6 py-12 text-center shadow-sm backdrop-blur-[1px]">
        <p className="text-sm text-muted-foreground">
          No listings roasted yet. Paste a product URL on the Roast tab to get
          started.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Roast history
      </h2>
      <ul className="mt-4 divide-y divide-border/55">
        {items.map((h) => (
          <li
            key={h._id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
          >
            <div className="relative size-[50px] shrink-0 overflow-hidden rounded-lg bg-border ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              {h.thumbUrl ? (
                <Image
                  src={h.thumbUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold text-foreground">
                {h.title || "Listing"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{h.brand}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-bold ${gradeBadgeClass(h.letterGrade)}`}
                >
                  {h.letterGrade}
                </span>
                <span className="font-semibold text-foreground/90">
                  {h.overallScore}/100
                </span>
                <span className="text-muted-foreground">
                  {formatRelativeTime(h.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={busyId === h._id}
                onClick={() => onView(h._id)}
                className={primaryBtn}
              >
                View results
              </button>
              <button
                type="button"
                disabled={busyId === h._id}
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("Delete this roast from history?")
                  ) {
                    onDelete(h._id);
                  }
                }}
                className={deleteBtn}
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
