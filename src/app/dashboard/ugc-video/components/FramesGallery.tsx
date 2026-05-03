"use client";

import Image from "next/image";
import { FaSpinner } from "react-icons/fa";

const LABELS = ["Hook", "Problem", "Demo", "CTA"];

type FramesGalleryProps = {
 frameUrls: string[];
 regenerating: boolean;
 onRegenerate: () => void;
 onDownloadFrame: (url: string, index: number) => void;
};

export function FramesGallery({
 frameUrls,
 regenerating,
 onRegenerate,
 onDownloadFrame,
}: FramesGalleryProps) {
 return (
 <div className="mt-10">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h3 className="font-heading text-base font-semibold text-foreground">
 Generated Frames
 </h3>
 <button
 type="button"
 disabled={regenerating}
 onClick={onRegenerate}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted disabled:opacity-50 dark:ring-white/[0.06]"
 >
 {regenerating ? "Regenerating…" : "Regenerate Frames"}
 </button>
 </div>

 <div className="relative mt-4">
 {regenerating ? (
 <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-border/80 bg-card/80 backdrop-blur-[2px] ring-1 ring-black/[0.04] dark:bg-card/85 dark:ring-white/[0.06]">
 <FaSpinner className="size-8 animate-spin text-primary" aria-hidden />
 </div>
 ) : null}
 <div className="flex flex-wrap gap-4">
 {frameUrls.slice(0, 4).map((url, i) => (
 <div key={`${url}-${i}`} className="w-[140px] shrink-0">
 <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 <Image
 src={url}
 alt={`Frame ${i + 1}`}
 fill
 className="object-cover"
 unoptimized
 />
 <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-foreground/40 group-hover:opacity-100">
 <button
 type="button"
 onClick={() => onDownloadFrame(url, i)}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
 >
 Download
 </button>
 </div>
 </div>
 <p className="mt-1 text-center text-xs text-muted-foreground">
 Frame {i + 1}: {LABELS[i] ?? `Shot ${i + 1}`}
 </p>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
