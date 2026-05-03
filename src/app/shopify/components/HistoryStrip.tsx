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
 className="w-24 shrink-0 rounded-lg border border-border bg-card p-2 text-left shadow-sm transition-colors hover:border-primary/40"
 >
 <div className="relative size-20 overflow-hidden rounded-md bg-foreground/10">
 {thumb ? (
 <Image src={thumb} alt="" fill sizes="80px" className="object-cover" unoptimized />
 ) : null}
 </div>
 <p className="mt-2 truncate text-left text-[10px] font-semibold text-foreground">
 {shortTitle(item.productTitle)}
 </p>
 {item.pushedToShopify ? (
 <span className="mt-1 block text-left text-[9px] font-bold uppercase tracking-wide text-emerald-600">
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
