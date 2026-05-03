"use client";

import { useState } from "react";
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
    return "bg-emerald-100 text-emerald-900";
  }
  if (score >= 7) {
    return "bg-sky-100 text-sky-900";
  }
  if (score >= 5) {
    return "bg-amber-100 text-amber-950";
  }
  return "bg-neutral-100 text-neutral-700";
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "tiktok") {
    return (
      <span className="rounded-md bg-black px-2 py-0.5 text-[10px] font-bold text-white">
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
      <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
        YouTube Shorts
      </span>
    );
  }
  return (
    <span className="rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
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
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          className={
            "inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold " +
            scorePillClass(clip.viralScore)
          }
        >
          #{index + 1}
        </span>
        <span className="text-sm font-semibold text-neutral-800">
          🔥 {clip.viralScore.toFixed(1)}/10
        </span>
        <div className="ml-auto">
          <PlatformBadge platform={clip.platform} />
        </div>
      </div>

      <h3 className="mt-3 font-heading text-base font-semibold leading-snug text-black">
        {clip.hookTitle}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">Why viral: {clip.whyViral}</p>

      <p className="mt-3 text-sm text-neutral-800">
        <span className="font-mono text-xs text-neutral-600">
          {secondsToTimestamp(clip.startTime)}
        </span>
        <span className="mx-1.5 text-neutral-400">→</span>
        <span className="font-mono text-xs text-neutral-600">
          {secondsToTimestamp(clip.endTime)}
        </span>
        <span className="ml-2 text-xs text-neutral-500">({Math.round(clip.duration)} sec)</span>
      </p>

      <div className="mt-3">
        <p className="text-xs font-medium text-neutral-500">Transcript:</p>
        <div
          className={
            "mt-1 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 " +
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
        <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          <a
            href={clip.cloudinaryUrl!}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Download Clip
          </a>
          <button
            type="button"
            onClick={() => void copyTs()}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Copy Timestamp
          </button>
          <a
            href={ytUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Open in YouTube
          </a>
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
            <p className="font-semibold">📌 Manual cut required</p>
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
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Copy Timestamp for CapCut
          </button>
          <p className="text-xs text-neutral-500">
            Auto-cutting requires a persistent server. Use the timestamps above in CapCut,
            Premiere, or DaVinci Resolve.
          </p>
        </div>
      )}
    </div>
  );
}
