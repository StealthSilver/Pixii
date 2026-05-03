"use client";

import type { ResponseFactor } from "@/lib/rufusTwin/types";

function importancePill(imp: ResponseFactor["importance"]): string {
 const base =
 "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
 if (imp === "high") {
 return base + "border-red-200 bg-red-50 text-red-900";
 }
 if (imp === "medium") {
 return base + "border-amber-200 bg-amber-50 text-amber-900";
 }
 return base + "border-border bg-muted text-muted-foreground";
}

type RankingFactorsProps = {
 factors: ResponseFactor[];
};

export function RankingFactors({ factors }: RankingFactorsProps) {
 if (!factors.length) {
 return null;
 }
 return (
 <ul className="space-y-3">
 {factors.map((f) => (
 <li
 key={f.factor}
 className="rounded-xl border border-border bg-card p-4 shadow-sm"
 >
 <div className="flex flex-wrap items-center gap-2">
 <h4 className="font-heading text-sm font-semibold text-foreground">
 {f.factor}
 </h4>
 <span className={importancePill(f.importance)}>
 {f.importance === "high"
 ? "High"
 : f.importance === "medium"
 ? "Medium"
 : "Low"}
 </span>
 </div>
 <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
 {f.explanation}
 </p>
 <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
 <span className="font-semibold"> Listing tip:</span>{" "}
 {f.listingTip}
 </div>
 </li>
 ))}
 </ul>
 );
}
