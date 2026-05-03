"use client";

import { useState } from "react";

const SCRIPT_OPTIONS: {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}[] = [
  {
    id: "honest_review",
    emoji: "⭐",
    name: "Honest Review",
    desc: "Raw first impression",
  },
  {
    id: "before_after",
    emoji: "✨",
    name: "Before & After",
    desc: "Transformation story",
  },
  {
    id: "day_in_life",
    emoji: "☀️",
    name: "Day in My Life",
    desc: "Natural daily routine",
  },
  {
    id: "transformation",
    emoji: "🔄",
    name: "Transformation",
    desc: "Results journey",
  },
  { id: "unboxing", emoji: "📦", name: "Unboxing", desc: "First time opening" },
  { id: "tutorial", emoji: "📚", name: "Tutorial", desc: "How to use it" },
  {
    id: "testimonial",
    emoji: "💬",
    name: "Testimonial",
    desc: "After using results",
  },
];

type VideoSettingsProps = {
  scriptStyle: string;
  onScriptStyleChange: (v: string) => void;
  platform: string;
  onPlatformChange: (v: string) => void;
};

const pill =
  "rounded-full border px-4 py-2 text-xs font-semibold transition-colors";

export function VideoSettings({
  scriptStyle,
  onScriptStyleChange,
  platform,
  onPlatformChange,
}: VideoSettingsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Video Settings
      </h2>

      <div className="mt-5 space-y-6">
        <div>
          <p className="text-sm font-medium text-foreground/90">Video Style</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SCRIPT_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onScriptStyleChange(o.id)}
                className={
                  "flex gap-3 rounded-lg border p-3 text-left transition-colors " +
                  (scriptStyle === o.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                    : "border-border bg-card hover:border-muted-foreground/35")
                }
              >
                <span className="text-xl">{o.emoji}</span>
                <span>
                  <span className="block font-semibold text-foreground">{o.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {o.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground/90">Platform</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className={
                pill +
                " " +
                (platform === "tiktok"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-muted-foreground/35")
              }
              onClick={() => onPlatformChange("tiktok")}
            >
              TikTok
            </button>
            <button
              type="button"
              className={
                pill +
                " " +
                (platform === "instagram_reels"
                  ? "border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white"
                  : "border-border bg-card text-foreground hover:border-muted-foreground/35")
              }
              onClick={() => onPlatformChange("instagram_reels")}
            >
              Instagram Reels
            </button>
            <button
              type="button"
              className={
                pill +
                " " +
                (platform === "youtube_shorts"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-border bg-card text-foreground hover:border-muted-foreground/35")
              }
              onClick={() => onPlatformChange("youtube_shorts")}
            >
              YouTube Shorts
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border/55 bg-muted p-4">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {previewOpen ? "Hide script outline" : "Preview Script"}
          </button>
          {previewOpen ? (
            <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">
              Your script will include:{"\n"}
              🎣 Hook (0-3s): Attention-grabbing opener{"\n"}
              😤 Problem (3-8s): Relatable pain point{"\n"}
              ✅ Solution (8-20s): Product demonstration{"\n"}
              📣 CTA (20-30s): Natural call to action
            </p>
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          ⏱ ~3-5 minutes · 🎬 4 visual frames · 🎙 30-sec voiceover · 💰 ~$0.15
        </p>
      </div>
    </section>
  );
}
