"use client";

import { useMemo, useState } from "react";
import type { AeoFullResult } from "../types";
import {
  collectCompetitorNames,
  highlightResponseHtml,
} from "../highlightHtml";

type EngineCardProps = {
  title: string;
  icon: string;
  score: number | null;
  unavailable?: boolean;
  /** API error message when unavailable. */
  errorDetail?: string;
  parsed: Record<string, unknown>;
  raw: string;
  brandName: string;
  allCompetitorNames: string[];
};

function badgeClass(kind: "good" | "mid" | "bad" | "muted"): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
  if (kind === "good") {
    return (
      base +
      "border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-200"
    );
  }
  if (kind === "mid") {
    return (
      base +
      "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100"
    );
  }
  if (kind === "bad") {
    return (
      base +
      "border-red-200/90 bg-red-50 text-red-900 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200"
    );
  }
  return base + "border-border bg-muted text-muted-foreground";
}

function strengthLabel(v: string): string {
  switch (v) {
    case "top_pick":
      return "Top pick";
    case "mentioned":
      return "Mentioned";
    case "listed":
      return "Listed";
    default:
      return "Not mentioned";
  }
}

function sentimentLabel(v: string): string {
  switch (v) {
    case "positive":
      return "Positive";
    case "neutral":
      return "Neutral";
    case "negative":
      return "Negative";
    default:
      return "Not mentioned";
  }
}

function scoreTone(score: number | null): "good" | "mid" | "bad" | "na" {
  if (score === null || score === undefined) {
    return "na";
  }
  if (score >= 70) {
    return "good";
  }
  if (score >= 40) {
    return "mid";
  }
  return "bad";
}

function scoreColorClass(score: number | null): string {
  const t = scoreTone(score);
  if (t === "good") {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (t === "mid") {
    return "text-amber-700 dark:text-amber-400";
  }
  if (t === "bad") {
    return "text-red-700 dark:text-red-400";
  }
  return "text-muted-foreground";
}

const secondaryBtn =
  "mt-3 inline-flex w-full items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

export function EngineCard({
  title,
  icon,
  score,
  unavailable,
  errorDetail,
  parsed,
  raw,
  brandName,
  allCompetitorNames,
}: EngineCardProps) {
  const [open, setOpen] = useState(false);
  const mentioned = Boolean(parsed.brand_mentioned);
  const rank =
    typeof parsed.mention_rank === "number" ? parsed.mention_rank : null;
  const strength = String(parsed.recommendation_strength ?? "not_mentioned");
  const sentiment = String(parsed.sentiment ?? "not_mentioned");
  const ctx =
    parsed.mention_context === null || parsed.mention_context === undefined
      ? null
      : String(parsed.mention_context);

  const localCompetitors = useMemo(
    () => collectCompetitorNames(parsed),
    [parsed],
  );
  const highlightNames = useMemo(() => {
    const s = new Set<string>();
    for (const n of allCompetitorNames) {
      s.add(n);
    }
    for (const n of localCompetitors) {
      s.add(n);
    }
    return [...s];
  }, [allCompetitorNames, localCompetitors]);

  const sentKind =
    sentiment === "positive"
      ? "good"
      : sentiment === "negative"
        ? "bad"
        : sentiment === "neutral"
          ? "mid"
          : "muted";

  const strengthKind =
    strength === "top_pick"
      ? "good"
      : strength === "mentioned" || strength === "listed"
        ? "mid"
        : "muted";

  const html = useMemo(
    () => highlightResponseHtml(raw, brandName, highlightNames),
    [raw, brandName, highlightNames],
  );

  return (
    <article className="flex flex-col rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 font-heading text-sm font-bold text-foreground shadow-sm ring-1 ring-black/[0.03] dark:bg-muted/50 dark:ring-white/[0.06]"
            aria-hidden
          >
            {icon}
          </span>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {title}
            </h3>
            {unavailable ? (
              <span className={badgeClass("muted")}>Unavailable</span>
            ) : null}
            {unavailable && errorDetail ? (
              <p className="mt-1 max-w-[14rem] text-[11px] leading-snug text-red-700 dark:text-red-300">
                {errorDetail}
              </p>
            ) : null}
          </div>
        </div>
        <p
          className={`font-heading text-3xl font-bold ${scoreColorClass(score)}`}
        >
          {score === null ? "—" : score}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">out of 100</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={badgeClass(mentioned && rank ? "good" : "muted")}>
          {mentioned && rank ? `#${rank} mention` : "Not mentioned"}
        </span>
        <span className={badgeClass(strengthKind)}>
          {strengthLabel(strength)}
        </span>
        <span className={badgeClass(sentKind)}>{sentimentLabel(sentiment)}</span>
      </div>

      <div className="mt-4 rounded-lg border-l-[3px] border-primary/40 bg-muted/40 px-3 py-2 text-sm text-foreground dark:bg-muted/25">
        {ctx ? (
          <p className="leading-relaxed">{ctx}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your brand was not mentioned in this response
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={secondaryBtn}
      >
        {open ? "Hide full response" : "View full response"}
      </button>
      {open ? (
        <div
          className="mt-2 max-h-[200px] overflow-y-auto rounded-lg border border-border/80 bg-muted/50 px-3 py-2 font-mono text-xs leading-relaxed text-foreground ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.05]"
          // eslint-disable-next-line react/no-danger -- intentional highlighting of trusted model output
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </article>
  );
}

export function competitorNamesFromResult(r: AeoFullResult): string[] {
  const names = new Set<string>();
  const bn = r.brandName.trim().toLowerCase();
  for (const row of r.competitors ?? []) {
    const nm = String(row.name ?? "").trim();
    if (nm && nm.toLowerCase() !== bn) {
      names.add(nm);
    }
  }
  for (const p of [r.gptParsed, r.claudeParsed, r.geminiParsed]) {
    for (const n of collectCompetitorNames(p)) {
      if (n.trim().toLowerCase() !== bn) {
        names.add(n);
      }
    }
  }
  return [...names];
}
