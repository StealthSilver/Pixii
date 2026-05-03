"use client";

import Image from "next/image";
import { useState } from "react";

type RenderCardProps = {
 url: string;
 angleLabel: string;
 styleLabel: string;
 onExpand: () => void;
 onDownload: () => void;
};

export function RenderCard({
 url,
 angleLabel,
 styleLabel,
 onExpand,
 onDownload,
}: RenderCardProps) {
 const [hover, setHover] = useState(false);

 return (
 <div
 className="group relative overflow-hidden rounded-xl border border-border/80 bg-muted/60 shadow-sm ring-1 ring-black/[0.04] dark:bg-muted/40 dark:ring-white/[0.06]"
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 >
 <div className="relative aspect-square w-full">
 <Image
 src={url}
 alt="Packaging render"
 fill
 className="object-cover"
 sizes="(max-width:768px) 100vw, 50vw"
 unoptimized
 />
 <div
 className={
 "absolute inset-0 flex items-center justify-center gap-3 bg-foreground/50 transition-opacity " +
 (hover ? "opacity-100" : "opacity-0 pointer-events-none")
 }
 >
 <button
 type="button"
 onClick={onDownload}
 className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.06] hover:bg-card dark:ring-white/15"
 aria-label="Download render"
 >
 <svg className="mx-auto size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M12 4v12m0 0l-4-4m4 4l4-4M6 20h12"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 />
 </svg>
 </button>
 <button
 type="button"
 onClick={onExpand}
 className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.06] hover:bg-card dark:ring-white/15"
 aria-label="Expand render"
 >
 <svg className="mx-auto size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M9 3H5v4M15 3h4v4M9 21H5v-4m10 4h4v-4"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 />
 </svg>
 </button>
 </div>
 </div>
 <p className="border-t border-border/55 px-2 py-2 text-center text-[11px] text-muted-foreground">
 {angleLabel} · {styleLabel}
 </p>
 </div>
 );
}
