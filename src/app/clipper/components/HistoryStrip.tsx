"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type HistoryItem = {
  _id: string;
  videoTitle: string;
  thumbnailUrl: string;
  createdAt: string;
};

type HistoryStripProps = {
  items: HistoryItem[];
  onSelect: (id: string) => void;
  busyId: string | null;
};

export function HistoryStrip({ items, onSelect, busyId }: HistoryStripProps) {
  const show = items.slice(0, 8);
  if (!show.length) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="font-heading text-sm font-semibold text-black">Previous Jobs</h3>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {show.map((h) => (
          <button
            key={h._id}
            type="button"
            disabled={busyId === h._id}
            onClick={() => onSelect(h._id)}
            className="group flex w-32 shrink-0 flex-col items-stretch text-left"
          >
            <div className="relative size-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              {h.thumbnailUrl ? (
                <Image
                  src={h.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover transition group-hover:opacity-90"
                  unoptimized
                />
              ) : null}
            </div>
            <p
              className="mt-2 line-clamp-1 text-xs font-semibold text-neutral-800"
              title={h.videoTitle}
            >
              {h.videoTitle.length > 15 ? `${h.videoTitle.slice(0, 15)}…` : h.videoTitle}
            </p>
            <p className="text-[10px] text-neutral-500">
              {h.createdAt ? formatRelativeTime(h.createdAt) : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
