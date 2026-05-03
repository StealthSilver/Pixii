"use client";

import type { ResponseFactor } from "@/lib/rufusTwin/types";

function importancePill(imp: ResponseFactor["importance"]): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
  if (imp === "high") {
    return (
      base +
      "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200"
    );
  }
  if (imp === "medium") {
    return (
      base +
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
    );
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
          className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]"
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
          <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-100">
            <span className="font-semibold">Listing tip:</span> {f.listingTip}
          </div>
        </li>
      ))}
    </ul>
  );
}
