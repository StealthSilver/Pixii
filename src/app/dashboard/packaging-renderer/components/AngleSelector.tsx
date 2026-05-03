"use client";

import type { RenderAngle } from "@/lib/models/packagingJobEnums";

const OPTIONS: { id: RenderAngle; label: string }[] = [
 { id: "front", label: "Front" },
 { id: "three_quarter", label: "Three-Quarter" },
 { id: "top_down", label: "Top Down" },
 { id: "hero", label: "Hero" },
];

type AngleSelectorProps = {
 value: RenderAngle;
 onChange: (v: RenderAngle) => void;
};

export function AngleSelector({ value, onChange }: AngleSelectorProps) {
 return (
 <div>
 <p className="text-sm font-medium text-foreground/90">Camera Angle</p>
 <div className="mt-2 flex flex-wrap gap-2">
 {OPTIONS.map((o) => {
 const active = value === o.id;
 return (
 <button
 key={o.id}
 type="button"
 onClick={() => onChange(o.id)}
 className={
 "rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-colors " +
 (active
 ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/25 dark:bg-primary/15"
 : "border-border bg-card text-foreground ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]")
 }
 >
 {o.label}
 </button>
 );
 })}
 </div>
 </div>
 );
}

export const ANGLE_LABELS: Record<RenderAngle, string> = {
 front: "Front",
 three_quarter: "Three-quarter",
 top_down: "Top down",
 hero: "Hero",
};
