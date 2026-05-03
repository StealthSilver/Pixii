"use client";

import Image from "next/image";

type FullscreenModalProps = {
 urls: string[];
 index: number;
 open: boolean;
 onClose: () => void;
 onPrev: () => void;
 onNext: () => void;
 onDownload: (url: string) => void;
};

export function FullscreenModal({
 urls,
 index,
 open,
 onClose,
 onPrev,
 onNext,
 onDownload,
}: FullscreenModalProps) {
 if (!open || urls.length === 0) {
 return null;
 }

 const url = urls[index] ?? urls[0];

 return (
 <div
 className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-foreground/88 backdrop-blur-[2px] p-4"
 role="dialog"
 aria-modal="true"
 aria-label="Render preview"
 >
 <button
 type="button"
 onClick={onClose}
 className="absolute right-4 top-4 rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm hover:bg-black/50"
 >
 ×
 </button>

 <div className="relative flex max-h-[90vh] max-w-[90vw] flex-1 items-center justify-center">
 {urls.length > 1 ? (
 <button
 type="button"
 onClick={onPrev}
 className="absolute left-0 z-10 rounded-lg border border-white/20 bg-black/35 px-3 py-4 text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm hover:bg-black/50 md:left-4"
 aria-label="Previous image"
 >
 ‹
 </button>
 ) : null}
 <div className="relative h-[min(90vh,900px)] w-[min(90vw,1200px)]">
 <Image
 src={url}
 alt=""
 fill
 className="object-contain"
 unoptimized
 priority
 />
 </div>
 {urls.length > 1 ? (
 <button
 type="button"
 onClick={onNext}
 className="absolute right-0 z-10 rounded-lg border border-white/20 bg-black/35 px-3 py-4 text-white shadow-sm ring-1 ring-white/15 backdrop-blur-sm hover:bg-black/50 md:right-4"
 aria-label="Next image"
 >
 ›
 </button>
 ) : null}
 </div>

 <button
 type="button"
 onClick={() => onDownload(url)}
 className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 hover:bg-primary/90 dark:ring-white/15"
 >
 Download
 </button>
 </div>
 );
}
