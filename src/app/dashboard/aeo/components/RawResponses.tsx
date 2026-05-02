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
    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-primary/10 text-primary"
      : "text-neutral-600 hover:bg-black/[0.04] hover:text-black")
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
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left font-heading text-sm font-semibold text-black"
      >
        View raw AI responses
        <span className="text-neutral-400">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="border-t border-neutral-200 px-5 pb-5 pt-3">
          <div
            className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3"
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
              GPT
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "claude"}
              className={tabBtn(tab === "claude")}
              onClick={() => setTab("claude")}
            >
              GPT mini
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gemini"}
              className={tabBtn(tab === "gemini")}
              onClick={() => setTab("gemini")}
            >
              Gemini
            </button>
          </div>
          <div
            className="mt-3 max-h-[280px] overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs leading-relaxed text-neutral-900"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : null}
    </section>
  );
}
