"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { HistoryStripItem } from "./types";

type Props = {
  items: HistoryStripItem[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
};

export function HistoryView({ items, onView, onDelete, busyId }: Props) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600 shadow-sm">
        No analyses yet. Paste a product listing URL to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-[720px] w-full border-collapse text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50/90">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
              Product
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">ASIN</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Reviews</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Listings</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Sentiment</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Date</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => {
            const l = h.listings?.[0];
            const score = h.marketIntelligence?.marketSentimentScore ?? 0;
            return (
              <tr key={h._id} className="border-b border-neutral-100">
                <td className="px-3 py-2">
                  <div className="flex max-w-[240px] items-center gap-2">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {l?.imageUrl ? (
                        <Image
                          src={l.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="40px"
                        />
                      ) : null}
                    </div>
                    <span className="line-clamp-2 text-xs font-medium text-neutral-900">
                      {l?.title ?? h.category}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{h.userAsin}</td>
                <td className="px-3 py-2 text-xs">{h.totalReviewsScraped}</td>
                <td className="px-3 py-2 text-xs">{h.totalListingsScraped}</td>
                <td className="px-3 py-2 text-xs font-semibold">{Math.round(score)}</td>
                <td className="px-3 py-2 text-xs text-neutral-600">
                  {h.createdAt ? formatRelativeTime(h.createdAt as string) : ""}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === h._id}
                      onClick={() => onView(h._id)}
                      className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
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
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
