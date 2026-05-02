"use client";

function Sparkle() {
  return (
    <svg
      className="inline size-4 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M8 1l1.2 4.8L14 8l-4.8 2.2L8 15l-1.2-4.8L2 8l4.8-2.2L8 1z"
        fill="#FF9900"
      />
    </svg>
  );
}

const TYPE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  product_recommendation: {
    label: "Product Recommendation",
    className: "border-blue-200 bg-blue-50 text-blue-900",
  },
  product_comparison: {
    label: "Product Comparison",
    className: "border-purple-200 bg-purple-50 text-purple-900",
  },
  use_case: {
    label: "Use Case",
    className: "border-teal-200 bg-teal-50 text-teal-900",
  },
  ingredient_question: {
    label: "Ingredient",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  concern_question: {
    label: "Concern",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  brand_question: {
    label: "Brand",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

function typeBadge(queryType: string) {
  const fallback = {
    label: queryType.replace(/_/g, " "),
    className: "border-neutral-200 bg-neutral-50 text-neutral-800",
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
    <section className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkle />
          <div>
            <p className="font-heading text-lg font-bold" style={{ color: "#FF9900" }}>
              Rufus
            </p>
            <p className="text-[11px] text-neutral-500">Amazon Shopping Assistant</p>
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
      <div className="space-y-3 px-4 py-4 text-sm leading-relaxed text-neutral-800">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="pointer-events-none px-4 pb-3 text-right text-[10px] text-neutral-400">
        ⚠ AI simulation — not actual Rufus output
      </p>
    </section>
  );
}
