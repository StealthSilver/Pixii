"use client";

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
      return "bg-emerald-100 text-emerald-900";
    case "B":
      return "bg-sky-100 text-sky-900";
    case "C":
      return "bg-amber-100 text-amber-900";
    case "D":
      return "bg-orange-100 text-orange-900";
    default:
      return "bg-red-100 text-red-900";
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
          No listings roasted yet. Paste a product URL to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-black">
        Roast history
      </h2>
      <ul className="mt-4 divide-y divide-neutral-100">
        {items.map((h) => (
          <li
            key={h._id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
          >
            <div className="relative size-[50px] shrink-0 overflow-hidden rounded-lg bg-neutral-200">
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
              <p className="line-clamp-2 font-semibold text-neutral-900">
                {h.title || "Listing"}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">{h.brand}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-bold ${gradeBadgeClass(h.letterGrade)}`}
                >
                  {h.letterGrade}
                </span>
                <span className="font-semibold text-neutral-700">
                  {h.overallScore}/100
                </span>
                <span className="text-neutral-500">
                  {formatRelativeTime(h.createdAt)}
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
                    window.confirm("Delete this roast from history?")
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
