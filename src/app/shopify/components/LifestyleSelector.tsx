"use client";

import type { ShopifyPhotoLifestyle } from "@/lib/shopify/lifestyleConstants";

export const LIFESTYLE_OPTIONS: {
  id: ShopifyPhotoLifestyle;
  emoji: string;
  label: string;
}[] = [
  { id: "kitchen", emoji: "🍳", label: "Kitchen" },
  { id: "bathroom", emoji: "🚿", label: "Bathroom" },
  { id: "gym", emoji: "💪", label: "Gym" },
  { id: "office", emoji: "💻", label: "Office" },
  { id: "bedroom", emoji: "🛏", label: "Bedroom" },
  { id: "outdoor", emoji: "🌿", label: "Outdoor" },
  { id: "studio_white", emoji: "⬜", label: "Studio White" },
  { id: "studio_dark", emoji: "⬛", label: "Studio Dark" },
  { id: "minimal_flat", emoji: "📐", label: "Flat Lay" },
];

type LifestyleSelectorProps = {
  value: ShopifyPhotoLifestyle;
  onChange: (v: ShopifyPhotoLifestyle) => void;
};

export function LifestyleSelector({ value, onChange }: LifestyleSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-neutral-700">Lifestyle Scene</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {LIFESTYLE_OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={
                "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors " +
                (sel
                  ? "border-primary/60 bg-primary/5 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-300")
              }
            >
              <span className="text-xl" aria-hidden>
                {opt.emoji}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-neutral-800">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
