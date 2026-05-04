"use client";

import { ListingImage } from "@/components/ListingImage";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { HistoryStripItem } from "./types";

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelect: (id: string) => void;
 busyId: string | null;
};

function sentimentPill(n: number): string {
 if (n >= 70) {
 return "border border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-100";
 }
 if (n >= 40) {
 return "border border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100";
 }
 return "border border-red-200/90 bg-red-50 text-red-950 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-100";
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
 className="group flex w-[200px] shrink-0 flex-col rounded-xl border border-border/80 bg-card/95 p-3 text-left shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] transition hover:border-muted-foreground/35 disabled:opacity-60 dark:ring-white/[0.05]"
 >
 <div className="mb-2">
 <ListingImage src={thumb} alt="" mode="banner" />
 </div>
 <p className="line-clamp-2 text-xs font-semibold text-foreground">{title}</p>
 <p className="mt-1 text-[11px] text-muted-foreground">
 {h.totalReviewsScraped} reviews · {h.totalListingsScraped} listings
 </p>
 <span
 className={`mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${sentimentPill(score)}`}
 >
 {Math.round(score)}/100
 </span>
 <p className="mt-2 text-[10px] text-muted-foreground">
 {h.createdAt ? formatRelativeTime(h.createdAt as string) : ""}
 </p>
 </button>
 );
 })}
 </div>
 </div>
 );
}
