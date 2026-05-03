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
 <p className="rounded-xl border border-border/80 bg-card/95 p-6 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 No analyses yet. Paste a product listing URL to get started.
 </p>
 );
 }

 return (
 <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <table className="min-w-[720px] w-full border-collapse text-sm">
 <thead className="border-b border-border bg-muted/90 dark:bg-muted/50">
 <tr>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
 Product
 </th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">ASIN</th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Reviews</th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Listings</th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Sentiment</th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Date</th>
 <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Actions</th>
 </tr>
 </thead>
 <tbody>
 {items.map((h) => {
 const l = h.listings?.[0];
 const score = h.marketIntelligence?.marketSentimentScore ?? 0;
 return (
 <tr key={h._id} className="border-b border-border/55">
 <td className="px-3 py-2">
 <div className="flex max-w-[240px] items-center gap-2">
 <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border/55 bg-muted">
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
 <span className="line-clamp-2 text-xs font-medium text-foreground">
 {l?.title ?? h.category}
 </span>
 </div>
 </td>
 <td className="px-3 py-2 font-mono text-xs">{h.userAsin}</td>
 <td className="px-3 py-2 text-xs">{h.totalReviewsScraped}</td>
 <td className="px-3 py-2 text-xs">{h.totalListingsScraped}</td>
 <td className="px-3 py-2 text-xs font-semibold">{Math.round(score)}</td>
 <td className="px-3 py-2 text-xs text-muted-foreground">
 {h.createdAt ? formatRelativeTime(h.createdAt as string) : ""}
 </td>
 <td className="px-3 py-2">
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 disabled={busyId === h._id}
 onClick={() => onView(h._id)}
 className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 hover:bg-primary/90 disabled:opacity-60 dark:ring-white/15"
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
 className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted disabled:opacity-60 dark:ring-white/[0.06]"
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
