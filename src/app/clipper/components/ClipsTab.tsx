"use client";

import { formatSeconds } from "@/lib/videoChopper/timeUtils";
import { ClipCard, type IdentifiedClipRow } from "./ClipCard";

type ClipsTabProps = {
  clips: IdentifiedClipRow[];
  videoId: string;
  videoDuration: number;
  onToast: (message: string, variant: "success" | "error") => void;
};

function modePlatform(clips: IdentifiedClipRow[]): string {
  const counts = new Map<string, number>();
  for (const c of clips) {
    const k = c.platform;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best = "";
  let n = 0;
  for (const [k, v] of counts) {
    if (v > n) {
      n = v;
      best = k;
    }
  }
  const labels: Record<string, string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube_shorts: "YouTube Shorts",
    twitter: "Twitter",
  };
  return labels[best] ?? best ?? "—";
}

export function ClipsTab({ clips, videoId, videoDuration, onToast }: ClipsTabProps) {
  const avgScore =
    clips.length > 0
      ? clips.reduce((s, c) => s + c.viralScore, 0) / clips.length
      : 0;
  const reach = Math.round(avgScore * 10_000);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {clips.map((c, i) => (
          <ClipCard
            key={`${c.clipIndex}-${i}`}
            clip={c}
            videoId={videoId}
            index={i}
            onToast={onToast}
          />
        ))}
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-950">
        <p className="font-semibold">
          ✓ {clips.length} clips identified from {formatSeconds(videoDuration)} video
        </p>
        <p className="mt-1">
          Best platform: {modePlatform(clips)} · Estimated reach: {reach.toLocaleString()}+
          potential views
        </p>
      </div>
    </div>
  );
}
