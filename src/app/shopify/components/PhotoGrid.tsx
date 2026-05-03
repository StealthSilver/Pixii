"use client";

import Image from "next/image";
import { useCallback } from "react";

type PhotoGridProps = {
 urls: string[];
 lifestyleKey: string;
 processingTimeMs: number | null;
 selectedUrl: string | null;
 onSelect: (url: string) => void;
};

export function PhotoGrid({
 urls,
 lifestyleKey,
 processingTimeMs,
 selectedUrl,
 onSelect,
}: PhotoGridProps) {
 const download = useCallback(async (url: string, index: number) => {
 try {
 const res = await fetch(url);
 const blob = await res.blob();
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = `pixii-lifestyle-${index + 1}.jpg`;
 a.click();
 URL.revokeObjectURL(a.href);
 } catch {
 window.open(url, "_blank", "noopener,noreferrer");
 }
 }, []);

 const display = urls.slice(0, 4);
 while (display.length < 4) {
 display.push("");
 }

 return (
 <div>
 <div className="grid grid-cols-2 gap-3">
 {display.map((url, i) =>
 url ? (
 <div
 key={url + i}
 className={
 "group relative overflow-hidden rounded-xl border-2 bg-foreground/10 shadow-sm transition-all " +
 (selectedUrl === url
 ? "border-primary ring-2 ring-primary/30"
 : "border-border")
 }
 >
 <div className="relative aspect-[4/3] w-full">
 <Image
 src={url}
 alt=""
 fill
 sizes="(max-width:768px) 50vw, 400px"
 className="object-cover"
 unoptimized
 />
 {selectedUrl === url ? (
 <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow">
 
 </span>
 ) : null}
 <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-black/0 p-3 opacity-0 transition-all group-hover:bg-foreground/55 group-hover:opacity-100">
 <button
 type="button"
 onClick={() => onSelect(url)}
 className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
 >
 Select
 </button>
 <button
 type="button"
 onClick={() => void download(url, i)}
 className="w-full rounded-lg border border-white/40 bg-card/90 px-3 py-2 text-xs font-semibold text-foreground hover:bg-card"
 >
 Download
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div
 key={`empty-${i}`}
 className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-muted text-xs text-muted-foreground/75"
 >
 —
 </div>
 ),
 )}
 </div>
 <p className="mt-3 text-left text-xs text-muted-foreground">
 Generated using {lifestyleKey.replace(/_/g, " ")} scene
 {processingTimeMs != null ? ` · ${(processingTimeMs / 1000).toFixed(1)}s` : ""}
 </p>
 </div>
 );
}
