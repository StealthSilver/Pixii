"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { HistoryStripItem } from "./types";

type HistoryStripProps = {
  items: HistoryStripItem[];
  onSelect: (id: string) => void;
  busyId: string | null;
};

function sentimentPill(n: number): string {
  if (n >= 70) {
    return "bg-emerald-100 text-emerald-900";
  }
  if (n >= 40) {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-red-100 text-red-900";
}

export function HistoryStrip({ items, onSelect, busyId }: HistoryStripProps) {
  const show = items.slice(0, 12);
  if (!show.length) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="font-heading text-sm font-semibold text-black">Previous Analyses</h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {show.map((h) => {
          const thumb = h.listings?.[0]?.imageUrl;
          const title = h.listings?.[0]?.title ?? h.category ?? "Analysis";
          const score = h.marketIntelligence?.marketSentimentScore ?? 0;
          return (
            <button
              key={h._id}
              type="button"
              disabled={busyId === h._id}
              onClick={() => onSelect(h._id)}
              className="group flex w-[200px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-neutral-300 disabled:opacity-60"
            >
              <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover object-center"
                    unoptimized
                    sizes="200px"
                  />
                ) : null}
              </div>
              <p className="line-clamp-2 text-xs font-semibold text-neutral-900">{title}</p>
              <p className="mt-1 text-[11px] text-neutral-600">
                {h.totalReviewsScraped} reviews · {h.totalListingsScraped} listings
              </p>
              <span
                className={`mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${sentimentPill(score)}`}
              >
                {Math.round(score)}/100
              </span>
              <p className="mt-2 text-[10px] text-neutral-500">
                {h.createdAt ? formatRelativeTime(h.createdAt as string) : ""}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
