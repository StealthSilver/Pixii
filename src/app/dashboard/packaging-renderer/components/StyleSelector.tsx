"use client";

import type { RenderStyle } from "@/lib/models/packagingJobEnums";

const OPTIONS: {
 id: RenderStyle;
 label: string;
 dot: string;
}[] = [
 {
 id: "studio_white",
 label: "Studio White",
 dot: "border border-border bg-card",
 },
 {
 id: "studio_dark",
 label: "Studio Dark",
 dot: "bg-foreground/65",
 },
 {
 id: "lifestyle_kitchen",
 label: "Kitchen",
 dot: "bg-amber-100",
 },
 {
 id: "lifestyle_gym",
 label: "Gym",
 dot: "bg-blue-500",
 },
 {
 id: "lifestyle_bathroom",
 label: "Bathroom",
 dot: "bg-sky-200",
 },
 {
 id: "shelf_display",
 label: "Shelf",
 dot: "bg-emerald-200",
 },
];

type StyleSelectorProps = {
 value: RenderStyle;
 onChange: (v: RenderStyle) => void;
};

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
 return (
 <div>
 <p className="text-sm font-medium text-foreground/90">Scene & Lighting</p>
 <div className="mt-2 flex flex-wrap gap-2">
 {OPTIONS.map((o) => {
 const active = value === o.id;
 return (
 <button
 key={o.id}
 type="button"
 onClick={() => onChange(o.id)}
 className={
 "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-colors " +
 (active
 ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/25 dark:bg-primary/15"
 : "border-border bg-card text-foreground ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]")
 }
 >
 <span className={`size-2.5 shrink-0 rounded-full ${o.dot}`} aria-hidden />
 {o.label}
 </button>
 );
 })}
 </div>
 </div>
 );
}

export const STYLE_LABELS: Record<RenderStyle, string> = {
 studio_white: "Studio White",
 studio_dark: "Studio Dark",
 lifestyle_kitchen: "Kitchen",
 lifestyle_gym: "Gym",
 lifestyle_bathroom: "Bathroom",
 shelf_display: "Shelf",
};
