"use client";

import Image from "next/image";

export type HistoryStripItem = {
 _id: string;
 productImageUrl: string;
 productName: string;
 cloudinaryFrameUrls: string[];
};

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelect: (jobId: string) => void;
};

export function HistoryStrip({ items, onSelect }: HistoryStripProps) {
 const shown = items.slice(0, 8);
 if (!shown.length) {
 return null;
 }
 return (
 <div className="mt-10 border-t border-border pt-8">
 <h3 className="font-heading text-base font-semibold text-foreground">
 Previous Videos
 </h3>
 <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
 {shown.map((h) => {
 const thumb = h.cloudinaryFrameUrls?.[0] ?? h.productImageUrl;
 const label =
 h.productName.length > 12
 ? `${h.productName.slice(0, 12)}…`
 : h.productName || "Video";
 return (
 <button
 key={h._id}
 type="button"
 onClick={() => onSelect(h._id)}
 className="w-[88px] shrink-0 text-left"
 >
 <div className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted/40 ring-1 ring-black/[0.04] transition-colors hover:border-primary/30 hover:ring-primary/20 dark:bg-muted/30 dark:ring-white/[0.06]">
 <Image
 src={thumb}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 </div>
 <p className="mt-1 truncate text-center text-xs text-muted-foreground">
 {label}
 </p>
 </button>
 );
 })}
 </div>
 </div>
 );
}
