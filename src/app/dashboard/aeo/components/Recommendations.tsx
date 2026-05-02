function pickIcon(text: string): string {
  const t = text.toLowerCase();
  if (
    t.includes("review") ||
    t.includes("rating") ||
    t.includes("trustpilot") ||
    t.includes("amazon review")
  ) {
    return "⭐";
  }
  if (
    t.includes("pr ") ||
    t.includes("press") ||
    t.includes("link") ||
    t.includes("backlink") ||
    t.includes("outreach")
  ) {
    return "🔗";
  }
  if (
    t.includes("position") ||
    t.includes("message") ||
    t.includes("voice") ||
    t.includes("tone")
  ) {
    return "💬";
  }
  return "📝";
}

type RecommendationsProps = {
  items: string[];
};

export function Recommendations({ items }: RecommendationsProps) {
  const four = items.slice(0, 4);
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-black">
        Recommendations
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Four focused moves to improve how models talk about your brand.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {four.map((text, i) => (
          <article
            key={i}
            className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xl leading-none">{pickIcon(text)}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                {text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
