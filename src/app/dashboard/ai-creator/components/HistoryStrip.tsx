"use client";

import Image from "next/image";

export type HistoryStripItem = {
 _id: string;
 title: string;
 overallScore: number;
 thumbUrl: string;
};

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelect: (id: string) => void;
};

export function HistoryStrip({ items, onSelect }: HistoryStripProps) {
 if (items.length === 0) {
 return null;
 }

 return (
 <section className="mt-8 border-t border-border/55 pt-8">
 <h3 className="font-heading text-sm font-semibold tracking-tight text-muted-foreground">
 Previous roasts
 </h3>
 <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
 {items.map((row) => (
 <button
 key={row._id}
 type="button"
 onClick={() => onSelect(row._id)}
 className="flex w-[200px] shrink-0 gap-3 rounded-xl border border-border/80 bg-card/95 p-3 text-left shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-primary/25 dark:ring-white/[0.05]"
 >
 <div className="relative size-[80px] shrink-0 overflow-hidden rounded-lg bg-muted">
 {row.thumbUrl ? (
 <Image
 src={row.thumbUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <p className="line-clamp-2 text-xs font-semibold text-foreground">
 {row.title || "Listing"}
 </p>
 <span className="mt-1 inline-block rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
 {row.overallScore}/100
 </span>
 </div>
 </button>
 ))}
 </div>
 </section>
 );
}
