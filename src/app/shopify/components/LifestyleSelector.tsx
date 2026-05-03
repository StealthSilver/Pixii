"use client";

import type { IconType } from "react-icons";
import {
 FaBath,
 FaBed,
 FaDumbbell,
 FaLaptop,
 FaLeaf,
 FaRulerCombined,
 FaSquare,
 FaSquareFull,
 FaUtensils,
} from "react-icons/fa";
import type { ShopifyPhotoLifestyle } from "@/lib/shopify/lifestyleConstants";

export const LIFESTYLE_OPTIONS: {
 id: ShopifyPhotoLifestyle;
 Icon: IconType;
 label: string;
}[] = [
 { id: "kitchen", Icon: FaUtensils, label: "Kitchen" },
 { id: "bathroom", Icon: FaBath, label: "Bathroom" },
 { id: "gym", Icon: FaDumbbell, label: "Gym" },
 { id: "office", Icon: FaLaptop, label: "Office" },
 { id: "bedroom", Icon: FaBed, label: "Bedroom" },
 { id: "outdoor", Icon: FaLeaf, label: "Outdoor" },
 {
 id: "studio_white",
 Icon: FaSquare,
 label: "Studio White",
 },
 {
 id: "studio_dark",
 Icon: FaSquareFull,
 label: "Studio Dark",
 },
 { id: "minimal_flat", Icon: FaRulerCombined, label: "Flat Lay" },
];

type LifestyleSelectorProps = {
 value: ShopifyPhotoLifestyle;
 onChange: (v: ShopifyPhotoLifestyle) => void;
};

export function LifestyleSelector({ value, onChange }: LifestyleSelectorProps) {
 return (
 <div>
 <p className="text-sm font-medium text-foreground/90">Lifestyle Scene</p>
 <div className="mt-2 grid grid-cols-3 gap-2">
 {LIFESTYLE_OPTIONS.map((opt) => {
 const sel = value === opt.id;
 const Icon = opt.Icon;
 return (
 <button
 key={opt.id}
 type="button"
 onClick={() => onChange(opt.id)}
 className={
 "flex flex-col items-center gap-1 rounded-lg border p-3 text-center ring-1 transition-colors " +
 (sel
 ? "border-primary/60 bg-primary/5 shadow-sm ring-primary/15 dark:bg-primary/10"
 : "border-border bg-card ring-black/[0.04] hover:border-muted-foreground/35 dark:ring-white/[0.06]")
 }
 >
 <span
 className={
 "flex size-8 items-center justify-center rounded-md text-primary ring-1 " +
 (opt.id === "studio_dark"
 ? "border border-border bg-foreground text-background ring-black/15 dark:ring-white/15"
 : "bg-primary/10 ring-black/[0.05] dark:bg-primary/15 dark:ring-white/10")
 }
 aria-hidden
 >
 <Icon className="size-4" />
 </span>
 <span className="text-[11px] font-semibold leading-tight text-foreground">
 {opt.label}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 );
}
