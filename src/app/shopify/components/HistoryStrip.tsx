"use client";

import Image from "next/image";

export type HistoryStripItem = {
 _id: string;
 productTitle: string;
 productImageUrl: string;
 cloudinaryUrls: string[];
 lifestyle: string;
 pushedToShopify: boolean;
 status: string;
 createdAt: string;
 processingTimeMs?: number | null;
};

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelectJob: (jobId: string) => void;
};

export function HistoryStrip({ items, onSelectJob }: HistoryStripProps) {
 if (!items.length) {
 return null;
 }

 const shortTitle = (t: string) => (t.length > 10 ? `${t.slice(0, 10)}…` : t);

 return (
 <section className="mt-10">
 <h3 className="font-heading text-sm font-semibold text-foreground">Previous Generations</h3>
 <div className="mt-3 flex gap-3 overflow-x-auto pb-2 pt-1">
 {items.map((item) => {
 const thumb = item.cloudinaryUrls?.[0] ?? item.productImageUrl;
 return (
 <button
 key={item._id}
 type="button"
 onClick={() => onSelectJob(item._id)}
 className="w-24 shrink-0 rounded-lg border border-border/80 bg-card/95 p-2 text-left shadow-sm ring-1 ring-black/[0.04] transition-colors hover:border-primary/40 dark:ring-white/[0.06]"
 >
 <div className="relative size-20 overflow-hidden rounded-md border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 {thumb ? (
 <Image src={thumb} alt="" fill sizes="80px" className="object-cover" unoptimized />
 ) : null}
 </div>
 <p className="mt-2 truncate text-left text-[10px] font-semibold text-foreground">
 {shortTitle(item.productTitle)}
 </p>
 {item.pushedToShopify ? (
 <span className="mt-1 block text-left text-[9px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
 Pushed
 </span>
 ) : null}
 </button>
 );
 })}
 </div>
 </section>
 );
}
