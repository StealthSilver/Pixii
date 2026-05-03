import type { HookPatternJson } from "../types";
import { Sparkline } from "./Sparkline";

function platformPillClass(platform: string): string {
  switch (platform) {
    case "Twitter":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "TikTok":
      return "border-pink-200 bg-pink-50 text-pink-700";
    case "Instagram":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "LinkedIn":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    default:
      return "border-border bg-muted text-foreground/90";
  }
}

function strengthBadge(score: number): { label: string; className: string } {
  if (score >= 8) {
    return {
      label: score.toFixed(1),
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }
  if (score >= 6) {
    return {
      label: score.toFixed(1),
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    label: score.toFixed(1),
    className: "border-red-200 bg-red-50 text-red-800",
  };
}

type HookCardProps = {
  pattern: HookPatternJson;
  onUseHook: (pattern: HookPatternJson) => void;
};

export function HookCard({ pattern, onUseHook }: HookCardProps) {
  const badge = strengthBadge(pattern.strengthScore);
  const examples = pattern.exampleHooks.slice(0, 3);

  return (
    <article className="flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {pattern.name}
        </h3>
        <span
          className={
            "rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums " +
            badge.className
          }
        >
          {badge.label}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {pattern.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {pattern.platformTags.map((p) => (
          <span
            key={p}
            className={
              "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
              platformPillClass(p)
            }
          >
            {p}
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-2 border-l-2 border-primary/35 pl-3">
        {examples.map((hook, i) => (
          <li
            key={i}
            className="text-sm italic leading-snug text-foreground/90"
          >
            “{hook}”
          </li>
        ))}
      </ul>

      <div className="mt-4 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">
          Trend · last {pattern.trendHistory.length || 1}{" "}
          {pattern.trendHistory.length === 1 ? "week" : "weeks"}
        </p>
        <div className="mt-1.5 h-9 w-full overflow-hidden rounded-md bg-muted/80 ring-1 ring-inset ring-border/45">
          <Sparkline
            values={
              pattern.trendHistory.length
                ? pattern.trendHistory
                : [pattern.strengthScore]
            }
            className="h-9 w-full text-primary"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/55 pt-4">
        <p className="text-xs font-medium text-muted-foreground">
          Used {pattern.usageCount} times
        </p>
        <button
          type="button"
          onClick={() => onUseHook(pattern)}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
        >
          Use This Hook →
        </button>
      </div>
    </article>
  );
}
