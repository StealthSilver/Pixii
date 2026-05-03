"use client";

import {
 PACKAGE_SHAPES,
 type PackageShape,
} from "@/lib/models/packagingJobEnums";

type ShapeSelectorProps = {
 value: PackageShape;
 onChange: (v: PackageShape) => void;
};

function ShapeIcon({ shape }: { shape: PackageShape }) {
 const common = "stroke-current fill-none";
 switch (shape) {
 case "box_square":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <path d="M8 28 L24 18 L40 28 L24 38 Z" className={common} strokeWidth="2" />
 <path d="M8 28 L8 36 L24 44 L40 36 L40 28" className={common} strokeWidth="2" />
 <path d="M24 18 L24 28" className={common} strokeWidth="2" />
 </svg>
 );
 case "box_rectangle":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <path d="M6 30 L22 16 L42 26 L26 40 Z" className={common} strokeWidth="2" />
 <path d="M6 30 L6 38 L26 46 L42 38 L42 26" className={common} strokeWidth="2" />
 <path d="M22 16 L22 28" className={common} strokeWidth="2" />
 </svg>
 );
 case "bottle_round":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <ellipse cx="24" cy="14" rx="10" ry="5" className={common} strokeWidth="2" />
 <path d="M14 14 V38 H34 V14" className={common} strokeWidth="2" />
 <ellipse cx="24" cy="38" rx="10" ry="5" className={common} strokeWidth="2" />
 </svg>
 );
 case "bottle_square":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <path d="M16 12 H32 V40 H16 Z" className={common} strokeWidth="2" />
 <path d="M16 12 L20 8 H28 L32 12" className={common} strokeWidth="2" />
 </svg>
 );
 case "tube":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <path d="M18 10 Q24 6 30 10 V38 Q24 42 18 38 Z" className={common} strokeWidth="2" />
 </svg>
 );
 case "pouch":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <path d="M14 16 H34 L38 36 Q24 44 10 36 Z" className={common} strokeWidth="2" />
 </svg>
 );
 case "can":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <ellipse cx="24" cy="14" rx="14" ry="5" className={common} strokeWidth="2" />
 <path d="M10 14 V34 H38 V14" className={common} strokeWidth="2" />
 <ellipse cx="24" cy="34" rx="14" ry="5" className={common} strokeWidth="2" />
 </svg>
 );
 case "jar":
 return (
 <svg viewBox="0 0 48 48" className="size-10 text-foreground/90" aria-hidden>
 <rect x="12" y="18" width="24" height="22" rx="3" className={common} strokeWidth="2" />
 <rect x="16" y="10" width="16" height="10" rx="2" className={common} strokeWidth="2" />
 <line x1="18" y1="14" x2="30" y2="14" className={common} strokeWidth="2" />
 </svg>
 );
 default:
 return null;
 }
}

const LABELS: Record<PackageShape, string> = {
 box_square: "Square box",
 box_rectangle: "Rect. box",
 bottle_round: "Round bottle",
 bottle_square: "Square bottle",
 tube: "Tube",
 pouch: "Pouch",
 can: "Can",
 jar: "Jar",
};

export function ShapeSelector({ value, onChange }: ShapeSelectorProps) {
 return (
 <div>
 <p className="text-sm font-medium text-foreground/90">Package Shape</p>
 <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
 {PACKAGE_SHAPES.map((shape) => {
 const active = value === shape;
 return (
 <button
 key={shape}
 type="button"
 onClick={() => onChange(shape)}
 className={
 "flex flex-col items-center rounded-xl border bg-card p-3 text-center shadow-sm ring-1 transition-colors " +
 (active
 ? "border-primary ring-2 ring-primary/25 dark:bg-card dark:ring-primary/30"
 : "border-border ring-black/[0.04] hover:border-muted-foreground/35 dark:ring-white/[0.06]")
 }
 >
 <ShapeIcon shape={shape} />
 <span className="mt-2 text-[11px] font-semibold leading-tight text-foreground">
 {LABELS[shape]}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 );
}
