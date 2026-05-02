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
      <p className="text-sm font-medium text-neutral-700">Camera Angle</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors " +
                (active
                  ? "border-primary bg-primary/10 text-black ring-2 ring-primary/25"
                  : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50")
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
