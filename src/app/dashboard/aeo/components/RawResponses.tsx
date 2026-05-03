"use client";

import { useMemo, useState } from "react";
import { highlightResponseHtml } from "../highlightHtml";

type Tab = "gpt" | "claude" | "gemini";

type RawResponsesProps = {
  gptRaw: string;
  claudeRaw: string;
  geminiRaw: string;
  brandName: string;
  competitorNames: string[];
};

function tabBtn(active: boolean): string {
  return (
    "rounded-lg px-3 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
  );
}

export function RawResponses({
  gptRaw,
  claudeRaw,
  geminiRaw,
  brandName,
  competitorNames,
}: RawResponsesProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("gpt");

  const html = useMemo(() => {
    const raw =
      tab === "gpt" ? gptRaw : tab === "claude" ? claudeRaw : geminiRaw;
    return highlightResponseHtml(raw, brandName, competitorNames);
  }, [tab, gptRaw, claudeRaw, geminiRaw, brandName, competitorNames]);

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-heading text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.03]"
      >
        View raw AI responses
        <span className="tabular-nums text-muted-foreground">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-border/70 px-5 pb-5 pt-3">
          <div
            className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
            role="tablist"
            aria-label="Raw response engines"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gpt"}
              className={tabBtn(tab === "gpt")}
              onClick={() => setTab("gpt")}
            >
              Detailed
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "claude"}
              className={tabBtn(tab === "claude")}
              onClick={() => setTab("claude")}
            >
              Concise
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gemini"}
              className={tabBtn(tab === "gemini")}
              onClick={() => setTab("gemini")}
            >
              Brands
            </button>
          </div>
          <div
            className="mt-3 max-h-[280px] overflow-y-auto rounded-lg border border-border/80 bg-muted/50 px-3 py-2 font-mono text-xs leading-relaxed text-foreground ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.05]"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : null}
    </section>
  );
}
