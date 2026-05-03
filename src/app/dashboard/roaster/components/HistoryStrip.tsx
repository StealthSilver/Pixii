"use client";

import Image from "next/image";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { HistoryStripItem } from "./types";

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelect: (id: string) => void;
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

export function HistoryStrip({ items, onSelect, busyId }: HistoryStripProps) {
 if (!items.length) {
 return null;
 }

 return (
 <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <h3 className="font-heading text-sm font-semibold text-foreground">
 Previous Roasts
 </h3>
 <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
 {items.map((h) => (
 <button
 key={h._id}
 type="button"
 disabled={busyId === h._id}
 onClick={() => onSelect(h._id)}
 className="w-[180px] shrink-0 rounded-lg border border-border bg-muted/80 p-3 text-left shadow-sm transition-colors hover:bg-card disabled:opacity-60"
 >
 <div className="relative size-[60px] overflow-hidden rounded-lg bg-border">
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
 <p className="mt-2 line-clamp-2 text-xs font-semibold text-foreground">
 {h.title || "Listing"}
 </p>
 <div className="mt-2 flex items-center justify-between gap-1">
 <span
 className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${gradeBadgeClass(h.letterGrade)}`}
 >
 {h.letterGrade}
 </span>
 <span className="text-[10px] font-semibold text-muted-foreground">
 {h.overallScore}/100
 </span>
 </div>
 <p className="mt-1 text-[10px] text-muted-foreground">
 {formatRelativeTime(h.createdAt)}
 </p>
 </button>
 ))}
 </div>
 </section>
 );
}
