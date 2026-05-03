"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaBook,
  FaBoxOpen,
  FaClock,
  FaCommentDots,
  FaExchangeAlt,
  FaFilm,
  FaMicrophone,
  FaStar,
  FaSun,
} from "react-icons/fa";

const SCRIPT_OPTIONS: {
 id: string;
 Icon: IconType;
 name: string;
 desc: string;
}[] = [
 {
 id: "honest_review",
 Icon: FaStar,
 name: "Honest Review",
 desc: "Raw first impression",
 },
  {
    id: "before_after",
    Icon: FaExchangeAlt,
    name: "Before & After",
    desc: "Transformation story",
  },
 {
 id: "day_in_life",
 Icon: FaSun,
 name: "Day in My Life",
 desc: "Natural daily routine",
 },
  {
    id: "transformation",
    Icon: FaExchangeAlt,
    name: "Transformation",
    desc: "Results journey",
  },
 {
 id: "unboxing",
 Icon: FaBoxOpen,
 name: "Unboxing",
 desc: "First time opening",
 },
 {
 id: "tutorial",
 Icon: FaBook,
 name: "Tutorial",
 desc: "How to use it",
 },
 {
 id: "testimonial",
 Icon: FaCommentDots,
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
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Video Settings
 </h2>

 <div className="mt-5 space-y-6">
 <div>
 <p className="text-sm font-medium text-foreground/90">Video Style</p>
 <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
 {SCRIPT_OPTIONS.map((o) => {
 const Icon = o.Icon;
 return (
 <button
 key={o.id}
 type="button"
 onClick={() => onScriptStyleChange(o.id)}
 className={
 "flex gap-3 rounded-lg border p-3 text-left transition-colors shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05] " +
 (scriptStyle === o.id
 ? "border-primary bg-primary/10 ring-primary/25 dark:bg-primary/15"
 : "border-border bg-card hover:border-muted-foreground/35")
 }
 >
 <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
 <Icon className="size-4" aria-hidden />
 </span>
 <span>
 <span className="block font-semibold text-foreground">{o.name}</span>
 <span className="mt-0.5 block text-xs text-muted-foreground">
 {o.desc}
 </span>
 </span>
 </button>
 );
 })}
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
 ? "border-foreground bg-foreground text-background shadow-sm ring-1 ring-black/15 dark:ring-white/20"
 : "border-border bg-card text-foreground shadow-sm ring-1 ring-black/[0.04] hover:border-muted-foreground/35 dark:ring-white/[0.06]")
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
 ? "border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-sm ring-1 ring-black/15 dark:ring-white/15"
 : "border-border bg-card text-foreground shadow-sm ring-1 ring-black/[0.04] hover:border-muted-foreground/35 dark:ring-white/[0.06]")
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
 ? "border-red-600 bg-red-600 text-white shadow-sm ring-1 ring-black/15 dark:ring-white/15"
 : "border-border bg-card text-foreground shadow-sm ring-1 ring-black/[0.04] hover:border-muted-foreground/35 dark:ring-white/[0.06]")
 }
 onClick={() => onPlatformChange("youtube_shorts")}
 >
 YouTube Shorts
 </button>
 </div>
 </div>

 <div className="rounded-lg border border-border/55 bg-muted/60 p-4 dark:bg-muted/40">
 <button
 type="button"
 onClick={() => setPreviewOpen((v) => !v)}
 className="text-sm font-semibold text-primary hover:underline"
 >
 {previewOpen ? "Hide script outline" : "Preview Script"}
 </button>
 {previewOpen ? (
 <div className="mt-3 space-y-2 text-sm text-foreground/90">
 <p className="font-medium text-foreground">Your script will include:</p>
 <ul className="list-inside list-disc space-y-1 pl-1">
 <li>Hook (0–3s): Attention-grabbing opener</li>
 <li>Problem (3–8s): Relatable pain point</li>
 <li>Solution (8–20s): Product demonstration</li>
 <li>CTA (20–30s): Natural call to action</li>
 </ul>
 </div>
 ) : null}
 </div>

 <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <FaClock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
 ~3–5 minutes
 </span>
 <span className="text-muted-foreground/40" aria-hidden>
 ·
 </span>
 <span className="inline-flex items-center gap-1">
 <FaFilm className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
 4 visual frames
 </span>
 <span className="text-muted-foreground/40" aria-hidden>
 ·
 </span>
 <span className="inline-flex items-center gap-1">
 <FaMicrophone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
 30-sec voiceover
 </span>
 <span className="text-muted-foreground/40" aria-hidden>
 ·
 </span>
 <span>~$0.15</span>
 </p>
 </div>
 </section>
 );
}
