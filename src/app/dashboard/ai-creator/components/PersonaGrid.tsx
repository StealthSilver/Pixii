"use client";

import { PERSONA_ROAST_ICONS } from "@/components/icons/PersonaRoastIcons";
import {
 PERSONAS,
 type InfluencerPersonaId,
} from "@/lib/aiCreator/personas";

const ACCENT: Record<
 string,
 { border: string; bg: string; left: string; badge: string }
> = {
 savage_sarah: {
 border: "border-rose-300 dark:border-rose-500/40",
 bg: "bg-rose-50/70 dark:bg-rose-950/35",
 left: "border-l-rose-500",
 badge:
 "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100",
 },
 brutally_honest_brad: {
 border: "border-blue-300 dark:border-blue-500/40",
 bg: "bg-blue-50/70 dark:bg-blue-950/35",
 left: "border-l-blue-500",
 badge:
 "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100",
 },
 marketing_maven_mia: {
 border: "border-purple-300 dark:border-purple-500/40",
 bg: "bg-purple-50/70 dark:bg-purple-950/35",
 left: "border-l-purple-500",
 badge:
 "bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100",
 },
 conversion_king_carlos: {
 border: "border-amber-300 dark:border-amber-500/40",
 bg: "bg-amber-50/70 dark:bg-amber-950/35",
 left: "border-l-amber-500",
 badge:
 "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
 },
 trendy_tiffany: {
 border: "border-teal-300 dark:border-teal-500/40",
 bg: "bg-teal-50/70 dark:bg-teal-950/35",
 left: "border-l-teal-500",
 badge:
 "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100",
 },
 data_driven_david: {
 border: "border-emerald-300 dark:border-emerald-500/40",
 bg: "bg-emerald-50/70 dark:bg-emerald-950/35",
 left: "border-l-emerald-600",
 badge:
 "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
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
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {entries.map(([id, p]) => {
 const a = ACCENT[id] ?? ACCENT.savage_sarah;
 const active = selected === id;
 const Icon = PERSONA_ROAST_ICONS[id];
 return (
 <button
 key={id}
 type="button"
 onClick={() => onSelect(id)}
 className={
 "rounded-xl border p-3 text-left shadow-sm transition-colors sm:p-4 " +
 (active
 ? `${a.border} ${a.bg} border-l-4 ${a.left}`
 : "border-border bg-card/95 shadow-sm ring-1 ring-black/[0.03] hover:border-muted-foreground/35 dark:ring-white/[0.05]")
 }
 >
 <div className="text-primary" aria-hidden>
 <Icon className="size-7 sm:size-8" />
 </div>
 <p className="mt-2 font-heading text-base font-bold text-foreground">
 {p.name}
 </p>
 <p className="text-xs text-muted-foreground">{p.handle}</p>
 <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
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
