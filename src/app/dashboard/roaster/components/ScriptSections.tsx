"use client";

import { useState } from "react";
import type { RoasterJobView } from "./types";

const SECTIONS: {
  key: keyof RoasterJobView["critiqueScript"];
  title: string;
  border: string;
}[] = [
  { key: "intro", title: "🎙 Intro", border: "border-blue-300" },
  { key: "scoreSummary", title: "📊 Score Summary", border: "border-amber-300" },
  { key: "titleCritique", title: "📝 Title", border: "border-red-300" },
  { key: "bulletCritique", title: "📋 Bullets", border: "border-orange-300" },
  { key: "imageCritique", title: "📸 Images", border: "border-purple-300" },
  { key: "pricingCritique", title: "💰 Pricing", border: "border-emerald-300" },
  { key: "quickWins", title: "⚡ Quick Wins", border: "border-teal-300" },
  { key: "closingChallenge", title: "🎯 Challenge", border: "border-border" },
];

type ScriptSectionsProps = {
  job: RoasterJobView;
};

export function ScriptSections({ job }: ScriptSectionsProps) {
  const [open, setOpen] = useState(false);
  const cs = job.critiqueScript;

  const downloadFull = () => {
    const blob = new Blob([cs.fullScript], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roaster-full-critique-script.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left font-heading text-sm font-semibold text-foreground"
      >
        📜 Full Critique Script
        <span className="text-muted-foreground/75">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          {SECTIONS.map(({ key, title, border }) => (
            <div
              key={key}
              className={`rounded-lg border border-border bg-muted/50 p-3 border-l-4 ${border}`}
            >
              <p className="text-xs font-semibold text-foreground/90">{title}</p>
              <p className="mt-1 text-sm text-foreground">
                {String(cs[key] ?? "")}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={downloadFull}
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Download Full Script
          </button>
        </div>
      ) : null}
    </section>
  );
}
