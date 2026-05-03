"use client";

import { RenderCard } from "./RenderCard";

type RendersGalleryProps = {
 urls: string[];
 angleLabel: string;
 styleLabel: string;
 onExpand: (index: number) => void;
 onDownloadOne: (url: string, index: number) => void;
};

export function RendersGallery({
 urls,
 angleLabel,
 styleLabel,
 onExpand,
 onDownloadOne,
}: RendersGalleryProps) {
 const n = urls.length;
 const gridClass =
 n >= 4
 ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
 : n === 2
 ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
 : "mx-auto max-w-xl";

 return (
 <div className={gridClass}>
 {urls.map((url, i) => (
 <RenderCard
 key={`${url}-${i}`}
 url={url}
 angleLabel={angleLabel}
 styleLabel={styleLabel}
 onExpand={() => onExpand(i)}
 onDownload={() => onDownloadOne(url, i)}
 />
 ))}
 </div>
 );
}
