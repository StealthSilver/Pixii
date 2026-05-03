"use client";

import Image from "next/image";
import { formatSeconds } from "@/lib/videoChopper/timeUtils";

export type PreviewMeta = {
 title: string;
 duration: number;
 channelName: string;
 thumbnailUrl: string;
};

type VideoPreviewCardProps = {
 meta: PreviewMeta;
 tooLong: boolean;
 longWarning: boolean;
};

export function VideoPreviewCard({ meta, tooLong, longWarning }: VideoPreviewCardProps) {
 return (
 <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
 <div className="relative aspect-video w-full bg-foreground/10">
 <Image
 src={meta.thumbnailUrl}
 alt=""
 fill
 className="object-cover"
 sizes="(max-width: 768px) 100vw, 640px"
 unoptimized
 />
 </div>
 <div className="p-4">
 <p className="line-clamp-2 font-heading text-base font-semibold text-foreground">
 {meta.title}
 </p>
 <p className="mt-1 text-sm text-muted-foreground">{meta.channelName}</p>
 <p className="mt-2 text-sm font-medium text-foreground/90">
 Duration: {formatSeconds(meta.duration)}
 </p>
 {tooLong ? (
 <p className="mt-3 text-sm font-semibold text-red-700">
 Video too long. Maximum 60 minutes.
 </p>
 ) : longWarning ? (
 <p className="mt-3 text-sm text-amber-800">
 Long video — processing may take 5-10 minutes
 </p>
 ) : null}
 </div>
 </div>
 );
}
