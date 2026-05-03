"use client";

import type { CompetitorProduct } from "@/lib/rufusTwin/types";

type CompetitorGridProps = {
  items: CompetitorProduct[];
};

export function CompetitorGrid({ items }: CompetitorGridProps) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No competitor suggestions for this query.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((c) => (
        <article
          key={`${c.estimatedRank}-${c.name}`}
          className="relative rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <span className="absolute left-3 top-3 inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground/90">
            #{c.estimatedRank}
          </span>
          <div className="mt-7">
            <h4 className="font-heading text-sm font-semibold text-foreground">
              {c.name}
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.brand}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              <span className="font-medium text-foreground">
                Why Rufus likes this:
              </span>{" "}
              {c.whyRufusLikes}
            </p>
            {c.keyAttributes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.keyAttributes.map((a) => (
                  <span
                    key={a}
                    className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/90"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
