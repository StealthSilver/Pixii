"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { HistoryStripItem } from "./types";

type HistoryStripProps = {
  items: HistoryStripItem[];
  onSelect: (id: string) => void;
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
      return "bg-foreground/10 text-foreground";
  }
}

export function HistoryStrip({ items, onSelect, busyId }: HistoryStripProps) {
  const show = items.slice(0, 12);
  if (!show.length) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="font-heading text-sm font-semibold text-foreground">
        Previous Analyses
      </h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {show.map((h) => (
          <button
            key={h._id}
            type="button"
            disabled={busyId === h._id}
            onClick={() => onSelect(h._id)}
            className="group flex w-[200px] shrink-0 flex-col rounded-xl border border-border bg-card p-3 text-left shadow-sm transition hover:border-muted-foreground/35 disabled:opacity-60"
          >
            <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg border border-border/55 bg-muted">
              {h.products?.[0]?.imageUrl ? (
                <Image
                  src={h.products[0].imageUrl}
                  alt=""
                  fill
                  className="object-cover object-center"
                  unoptimized
                  sizes="200px"
                />
              ) : null}
            </div>
            <p className="line-clamp-2 text-xs font-semibold text-foreground">
              {h.category || "Analysis"}
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              {formatRevenue(h.marketAnalysis.totalMarketSizeMonthly)}
            </p>
            <span
              className={`mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${competitionPill(h.marketAnalysis.competitionLevel)}`}
            >
              {h.marketAnalysis.competitionLevel.replace(/_/g, " ")}
            </span>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {h.createdAt ? formatRelativeTime(h.createdAt) : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
