"use client";

import { useState } from "react";
import type { ListingAnalysis, RoastScript } from "@/lib/aiCreator/types";
import { FixList } from "./FixList";

type ScriptTabProps = {
  jobId: string;
  roastScript: RoastScript | null | undefined;
  listingAnalysis: ListingAnalysis | null | undefined;
  onToast: (message: string, variant: "success" | "error") => void;
  onJobRefresh?: () => Promise<void>;
};

const SECTIONS: {
  key: keyof RoastScript;
  title: string;
  border: string;
}[] = [
  { key: "hook", title: "🎣 Hook", border: "border-blue-300" },
  {
    key: "firstImpression",
    title: "👀 First Impression",
    border: "border-amber-300",
  },
  { key: "titleRoast", title: "📝 Title Roast", border: "border-red-300" },
  {
    key: "bulletRoast",
    title: "📋 Bullet Roast",
    border: "border-orange-300",
  },
  { key: "imageRoast", title: "📸 Image Take", border: "border-purple-300" },
  {
    key: "pricingTake",
    title: "💰 Pricing Take",
    border: "border-emerald-300",
  },
  {
    key: "competitorJab",
    title: "⚔️ Competitor Jab",
    border: "border-pink-300",
  },
  {
    key: "redeemingQualities",
    title: "✨ Good Stuff",
    border: "border-teal-300",
  },
  { key: "callToAction", title: "👋 Sign Off", border: "border-border" },
];

export function ScriptTab({
  jobId,
  roastScript,
  listingAnalysis,
  onToast,
  onJobRefresh,
}: ScriptTabProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const copyFull = async () => {
    await navigator.clipboard.writeText(roastScript?.fullScript ?? "");
    onToast("Full script copied.", "success");
  };

  const regenerate = async (fb?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-creator/regenerate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, feedback: fb }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Regenerate failed");
      }
      onToast("Script and voiceover updated.", "success");
      await onJobRefresh?.();
    } catch (e) {
      onToast(
        e instanceof Error ? e.message : "Regenerate failed.",
        "error",
      );
    } finally {
      setLoading(false);
      setFeedback("");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          The roast script
        </h3>
        <div className="mt-4 space-y-3">
          {SECTIONS.map(({ key, title, border }) => (
            <div
              key={key}
              className={`rounded-xl border-l-4 ${border} border-y border-r border-border bg-card p-4 shadow-sm`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {String(roastScript?.[key] ?? "")}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void copyFull()}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Copy full script
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void regenerate()}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Working..." : "Regenerate script"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            type="text"
            placeholder="Optional feedback for rewrite..."
            className="h-11 flex-1 rounded-lg border border-border px-3 text-sm"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void regenerate(feedback)}
            className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-60"
          >
            Regenerate with feedback
          </button>
        </div>
      </div>

      <FixList weaknesses={listingAnalysis?.weaknesses ?? []} />
    </div>
  );
}