"use client";

function Sparkle() {
  return (
    <svg
      className="inline size-4 shrink-0 text-primary"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 1l1.2 4.8L14 8l-4.8 2.2L8 15l-1.2-4.8L2 8l4.8-2.2L8 1z"
        fill="currentColor"
      />
    </svg>
  );
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  product_recommendation: {
    label: "Product recommendation",
    className:
      "border-blue-200/90 bg-blue-50 text-blue-900 dark:border-blue-500/35 dark:bg-blue-950/45 dark:text-blue-200",
  },
  product_comparison: {
    label: "Product comparison",
    className:
      "border-purple-200/90 bg-purple-50 text-purple-900 dark:border-purple-500/35 dark:bg-purple-950/45 dark:text-purple-200",
  },
  use_case: {
    label: "Use case",
    className:
      "border-teal-200/90 bg-teal-50 text-teal-900 dark:border-teal-500/35 dark:bg-teal-950/45 dark:text-teal-200",
  },
  ingredient_question: {
    label: "Ingredient",
    className:
      "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200",
  },
  concern_question: {
    label: "Concern",
    className:
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100",
  },
  brand_question: {
    label: "Brand",
    className:
      "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-200",
  },
};

function typeBadge(queryType: string) {
  const fallback = {
    label: queryType.replace(/_/g, " "),
    className: "border-border bg-muted text-foreground",
  };
  return TYPE_BADGES[queryType] ?? fallback;
}

type RufusResponseCardProps = {
  queryType: string;
  body: string;
};

export function RufusResponseCard({ queryType, body }: RufusResponseCardProps) {
  const meta = typeBadge(queryType);
  const paragraphs = body.split(/\n+/).filter(Boolean);

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/55 bg-muted/40 px-4 py-3 dark:bg-muted/25">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkle />
          <div>
            <p className="font-heading text-lg font-bold text-primary">Rufus</p>
            <p className="text-[11px] text-muted-foreground">
              Amazon shopping assistant
            </p>
          </div>
        </div>
        <span
          className={
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold " +
            meta.className
          }
        >
          {meta.label}
        </span>
      </div>
      <div className="space-y-3 px-4 py-4 text-sm leading-relaxed text-foreground">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="pointer-events-none px-4 pb-3 text-right text-[10px] text-muted-foreground/80">
        AI simulation — not actual Rufus output
      </p>
    </section>
  );
}
