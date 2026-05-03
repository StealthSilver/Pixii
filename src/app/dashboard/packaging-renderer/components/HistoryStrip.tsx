"use client";

import Image from "next/image";

export type HistoryStripItem = {
 _id: string;
 outputUrls: string[];
 packageShape: string;
};

type HistoryStripProps = {
 items: HistoryStripItem[];
 onSelect: (id: string) => void;
};

const SHAPE_SHORT: Record<string, string> = {
 box_square: "Square",
 box_rectangle: "Rectangle",
 bottle_round: "Bottle",
 bottle_square: "Sq. bottle",
 tube: "Tube",
 pouch: "Pouch",
 can: "Can",
 jar: "Jar",
};

export function HistoryStrip({ items, onSelect }: HistoryStripProps) {
 const slice = items.slice(0, 10);
 if (!slice.length) {
 return null;
 }

 return (
 <section className="mt-10">
 <h3 className="font-heading text-lg font-semibold text-foreground">
 Previous Renders
 </h3>
 <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
 {slice.map((item) => {
 const thumb = item.outputUrls[0];
 const label =
 SHAPE_SHORT[item.packageShape] ?? item.packageShape ?? "Job";
 return (
 <button
 key={item._id}
 type="button"
 onClick={() => onSelect(item._id)}
 className="flex w-24 shrink-0 flex-col gap-1 rounded-lg border border-border/80 bg-card/95 p-2 text-left shadow-sm ring-1 ring-black/[0.04] transition-colors hover:border-primary/25 dark:ring-white/[0.06]"
 >
 <div className="relative size-20 overflow-hidden rounded-md border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 {thumb ? (
 <Image
 src={thumb}
 alt=""
 fill
 className="object-cover"
 sizes="80px"
 unoptimized
 />
 ) : null}
 </div>
 <span className="truncate text-[10px] font-semibold text-foreground/90">
 {label}
 </span>
 </button>
 );
 })}
 </div>
 </section>
 );
}
