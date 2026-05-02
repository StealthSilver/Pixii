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
    dot: "border border-neutral-300 bg-white",
  },
  {
    id: "studio_dark",
    label: "Studio Dark",
    dot: "bg-neutral-700",
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
      <p className="text-sm font-medium text-neutral-700">Scene & Lighting</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors " +
                (active
                  ? "border-primary bg-primary/10 text-black ring-2 ring-primary/25"
                  : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50")
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
