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
 return "border border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-100";
 case "medium":
 return "border border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100";
 case "high":
 return "border border-orange-200/90 bg-orange-50 text-orange-950 dark:border-orange-500/35 dark:bg-orange-950/45 dark:text-orange-100";
 case "very_high":
 return "border border-red-200/90 bg-red-50 text-red-950 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-100";
 default:
 return "border border-border bg-muted/80 text-foreground";
 }
}

export function HistoryStrip({ items, onSelect, busyId }: HistoryStripProps) {
 const show = items.slice(0, 12);
 if (!show.length) {
 return null;
 }

 return (
 <div className="mt-8">
 <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
 Previous analyses
 </h3>
 <div className="mt-3 flex gap-3 overflow-x-auto scroll-smooth pb-2 [-webkit-overflow-scrolling:touch]">
 {show.map((h) => (
 <button
 key={h._id}
 type="button"
 disabled={busyId === h._id}
 onClick={() => onSelect(h._id)}
 className="group flex w-44 shrink-0 flex-col rounded-xl border border-border/80 bg-card/95 p-3 text-left shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] transition hover:border-muted-foreground/35 disabled:opacity-60 dark:ring-white/[0.05] sm:w-[200px]"
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
 <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
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
