"use client";

import {
  PERSONAS,
  type InfluencerPersonaId,
} from "@/lib/aiCreator/personas";

const ACCENT: Record<
  string,
  { border: string; bg: string; left: string; badge: string }
> = {
  savage_sarah: {
    border: "border-rose-300",
    bg: "bg-rose-50/70",
    left: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-900",
  },
  brutally_honest_brad: {
    border: "border-blue-300",
    bg: "bg-blue-50/70",
    left: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-900",
  },
  marketing_maven_mia: {
    border: "border-purple-300",
    bg: "bg-purple-50/70",
    left: "border-l-purple-500",
    badge: "bg-purple-100 text-purple-900",
  },
  conversion_king_carlos: {
    border: "border-amber-300",
    bg: "bg-amber-50/70",
    left: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-900",
  },
  trendy_tiffany: {
    border: "border-teal-300",
    bg: "bg-teal-50/70",
    left: "border-l-teal-500",
    badge: "bg-teal-100 text-teal-900",
  },
  data_driven_david: {
    border: "border-emerald-300",
    bg: "bg-emerald-50/70",
    left: "border-l-emerald-600",
    badge: "bg-emerald-100 text-emerald-900",
  },
};

type PersonaGridProps = {
  selected: InfluencerPersonaId;
  onSelect: (id: InfluencerPersonaId) => void;
};

export function PersonaGrid({ selected, onSelect }: PersonaGridProps) {
  const entries = Object.entries(PERSONAS) as [
    InfluencerPersonaId,
    (typeof PERSONAS)[InfluencerPersonaId],
  ][];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([id, p]) => {
        const a = ACCENT[id] ?? ACCENT.savage_sarah;
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={
              "rounded-xl border p-4 text-left shadow-sm transition-colors " +
              (active
                ? `${a.border} ${a.bg} border-l-4 ${a.left}`
                : "border-neutral-200 bg-white hover:border-neutral-300")
            }
          >
            <div className="text-3xl" aria-hidden>
              {p.emoji}
            </div>
            <p className="mt-2 font-heading text-base font-bold text-black">
              {p.name}
            </p>
            <p className="text-xs text-neutral-500">{p.handle}</p>
            <p className="mt-2 line-clamp-2 text-xs text-neutral-600">
              {p.description}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.badge}`}
            >
              {p.voiceDescription}
            </span>
          </button>
        );
      })}
    </div>
  );
}
