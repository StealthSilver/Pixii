"use client";

import { useState } from "react";
import { FaFire, FaMapPin } from "react-icons/fa";
import { formatSeconds, secondsToTimestamp } from "@/lib/videoChopper/timeUtils";

export type IdentifiedClipRow = {
 clipIndex: number;
 startTime: number;
 endTime: number;
 duration: number;
 hookTitle: string;
 whyViral: string;
 platform: string;
 transcriptText: string;
 viralScore: number;
 clipStatus: string;
 cloudinaryUrl: string | null;
 thumbnailUrl: string | null;
};

type ClipCardProps = {
 clip: IdentifiedClipRow;
 videoId: string;
 index: number;
 onToast: (message: string, variant: "success" | "error") => void;
};

function scorePillClass(score: number): string {
 if (score >= 9) {
 return "bg-emerald-500/15 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100";
 }
 if (score >= 7) {
 return "bg-sky-500/15 text-sky-900 dark:bg-sky-400/15 dark:text-sky-100";
 }
 if (score >= 5) {
 return "bg-amber-500/15 text-amber-950 dark:bg-amber-500/15 dark:text-amber-100";
 }
 return "bg-muted text-foreground/90 ring-1 ring-black/[0.04] dark:ring-white/[0.06]";
}

function PlatformBadge({ platform }: { platform: string }) {
 const p = platform.toLowerCase();
 if (p === "tiktok") {
 return (
 <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm ring-1 ring-black/[0.04] dark:bg-muted dark:ring-white/[0.06]">
 TikTok
 </span>
 );
 }
 if (p === "instagram") {
 return (
 <span className="bg-gradient-to-r from-fuchsia-500 to-orange-400 bg-clip-text text-[10px] font-bold text-transparent">
 Instagram
 </span>
 );
 }
 if (p === "youtube_shorts") {
 return (
 <span className="rounded-md border border-red-600/80 bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-black/15 dark:ring-white/15">
 YouTube Shorts
 </span>
 );
 }
 return (
 <span className="rounded-md border border-sky-600/90 bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-black/15 dark:ring-white/15">
 Twitter
 </span>
 );
}

/** Heuristic: real Cloudinary video vs thumbnail preview */
function isLikelyVideoUrl(url: string | null): boolean {
 if (!url) {
 return false;
 }
 if (url.includes("/video/upload/")) {
 return true;
 }
 return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function ClipCard({ clip, videoId, index, onToast }: ClipCardProps) {
 const [expanded, setExpanded] = useState(false);
 const ytUrl = `https://youtu.be/${videoId}?t=${Math.floor(clip.startTime)}`;
 const isVideo =
 clip.clipStatus === "complete" &&
 Boolean(clip.cloudinaryUrl) &&
 isLikelyVideoUrl(clip.cloudinaryUrl);

 const showManual =
 clip.clipStatus === "preview_only" ||
 clip.clipStatus === "failed" ||
 !isVideo;

 const copyTs = async () => {
 const t = `Start: ${secondsToTimestamp(clip.startTime)} | End: ${secondsToTimestamp(clip.endTime)}`;
 try {
 await navigator.clipboard.writeText(t);
 onToast("Timestamp copied.", "success");
 } catch {
 onToast("Could not copy.", "error");
 }
 };

 const copyCapcut = async () => {
 const t = `Cut from ${formatSeconds(clip.startTime)} to ${formatSeconds(clip.endTime)} · ${clip.hookTitle}`;
 try {
 await navigator.clipboard.writeText(t);
 onToast("Copied for your editor.", "success");
 } catch {
 onToast("Could not copy.", "error");
 }
 };

 return (
 <div className="flex flex-col rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <div className="flex items-start justify-between gap-2">
 <span
 className={
 "inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold " +
 scorePillClass(clip.viralScore)
 }
 >
 #{index + 1}
 </span>
 <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
 <FaFire className="size-3.5 text-orange-500" aria-hidden />
 {clip.viralScore.toFixed(1)}/10
 </span>
 <div className="ml-auto">
 <PlatformBadge platform={clip.platform} />
 </div>
 </div>

 <h3 className="mt-3 font-heading text-base font-semibold leading-snug text-foreground">
 {clip.hookTitle}
 </h3>
 <p className="mt-1 text-sm text-muted-foreground">Why viral: {clip.whyViral}</p>

 <p className="mt-3 text-sm text-foreground">
 <span className="font-mono text-xs text-muted-foreground">
 {secondsToTimestamp(clip.startTime)}
 </span>
 <span className="mx-1.5 text-muted-foreground/75">→</span>
 <span className="font-mono text-xs text-muted-foreground">
 {secondsToTimestamp(clip.endTime)}
 </span>
 <span className="ml-2 text-xs text-muted-foreground">({Math.round(clip.duration)} sec)</span>
 </p>

 <div className="mt-3">
 <p className="text-xs font-medium text-muted-foreground">Transcript:</p>
 <div
 className={
 "mt-1 rounded-lg border border-border/80 bg-muted/70 px-3 py-2 text-sm text-foreground ring-1 ring-black/[0.03] dark:bg-muted/50 dark:ring-white/[0.06] " +
 (expanded ? "" : "line-clamp-4")
 }
 >
 {clip.transcriptText}
 </div>
 {clip.transcriptText.length > 200 ? (
 <button
 type="button"
 onClick={() => setExpanded(!expanded)}
 className="mt-1 text-xs font-semibold text-primary hover:underline"
 >
 {expanded ? "Show less" : "Show more"}
 </button>
 ) : null}
 </div>

 {!showManual ? (
 <div className="mt-4 flex flex-wrap gap-2 border-t border-border/55 pt-4">
 <a
 href={clip.cloudinaryUrl!}
 download
 target="_blank"
 rel="noreferrer"
 className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition hover:bg-primary/90 dark:ring-white/15"
 >
 Download Clip
 </a>
 <button
 type="button"
 onClick={() => void copyTs()}
 className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Copy Timestamp
 </button>
 <a
 href={ytUrl}
 target="_blank"
 rel="noreferrer"
 className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Open in YouTube
 </a>
 </div>
 ) : (
 <div className="mt-4 space-y-3 border-t border-border/55 pt-4">
 <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-100">
 <p className="flex items-center gap-2 font-semibold">
 <FaMapPin className="size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
 Manual cut required
 </p>
 <p className="mt-1 font-mono text-xs">
 Start: {formatSeconds(clip.startTime)} → End: {formatSeconds(clip.endTime)}
 </p>
 <a
 href={ytUrl}
 target="_blank"
 rel="noreferrer"
 className="mt-2 inline-block text-sm font-semibold text-primary underline"
 >
 Open this moment in YouTube →
 </a>
 </div>
 <button
 type="button"
 onClick={() => void copyCapcut()}
 className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Copy Timestamp for CapCut
 </button>
 <p className="text-xs text-muted-foreground">
 Auto-cutting requires a persistent server. Use the timestamps above in CapCut,
 Premiere, or DaVinci Resolve.
 </p>
 </div>
 )}
 </div>
 );
}
