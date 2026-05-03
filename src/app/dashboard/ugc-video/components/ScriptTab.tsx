"use client";

import { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { CaptionsDisplay } from "./CaptionsDisplay";
import { VoiceoverPlayer } from "./VoiceoverPlayer";

type ScriptBlock = {
  hook: string;
  problem: string;
  solution: string;
  cta: string;
  fullScript: string;
  wordCount: number;
};

type ScriptTabProps = {
  jobId: string;
  script: ScriptBlock;
  voiceoverUrl: string;
  voiceId: string;
  captionsText: string;
  onJobRefresh: () => Promise<void>;
  onToast: (message: string, variant: "success" | "error") => void;
};

export function ScriptTab({
  jobId,
  script,
  voiceoverUrl,
  voiceId,
  captionsText,
  onJobRefresh,
  onToast,
}: ScriptTabProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  async function postRegenerate(body: { feedback?: string }) {
    setLoading(true);
    try {
      const res = await fetch("/api/ugc-video/regenerate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ...body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Regenerate failed");
      }
      await onJobRefresh();
      onToast("Script updated.", "success");
      setFeedback("");
      setShowFeedback(false);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Regenerate failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Generated Script
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {script.wordCount} words · ~30 seconds
          </p>
        </div>
        {loading ? (
          <FaSpinner className="size-5 animate-spin text-primary" aria-hidden />
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border-l-4 border-sky-500 bg-card p-4 shadow-sm ring-1 ring-border/45">
          <p className="text-xs font-semibold text-sky-800">🎣 Hook · 0-3 sec</p>
          <p className="mt-2 text-sm text-foreground">{script.hook}</p>
        </div>
        <div className="rounded-lg border-l-4 border-amber-500 bg-card p-4 shadow-sm ring-1 ring-border/45">
          <p className="text-xs font-semibold text-amber-900">
            😤 Problem · 3-8 sec
          </p>
          <p className="mt-2 text-sm text-foreground">{script.problem}</p>
        </div>
        <div className="rounded-lg border-l-4 border-emerald-500 bg-card p-4 shadow-sm ring-1 ring-border/45">
          <p className="text-xs font-semibold text-emerald-900">
            ✅ Solution · 8-20 sec
          </p>
          <p className="mt-2 text-sm text-foreground">{script.solution}</p>
        </div>
        <div className="rounded-lg border-l-4 border-violet-500 bg-card p-4 shadow-sm ring-1 ring-border/45">
          <p className="text-xs font-semibold text-violet-900">
            📣 CTA · 20-30 sec
          </p>
          <p className="mt-2 text-sm text-foreground">{script.cta}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            await navigator.clipboard.writeText(script.fullScript);
            onToast("Script copied.", "success");
          }}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
        >
          Copy Full Script
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void postRegenerate({})}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
        >
          Regenerate Script
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowFeedback((s) => !s)}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50"
        >
          Regenerate with Feedback
        </button>
      </div>

      {showFeedback ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm font-medium text-foreground/90">
            What should change?
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. More energy in the hook"
            />
          </label>
          <button
            type="button"
            disabled={loading || !feedback.trim()}
            onClick={() => void postRegenerate({ feedback })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      ) : null}

      {voiceoverUrl ? (
        <VoiceoverPlayer
          voiceoverUrl={voiceoverUrl}
          voiceId={voiceId}
          onDownload={() => {
            const a = document.createElement("a");
            a.href = voiceoverUrl;
            a.download = "pixii-ugc-voiceover.mp3";
            a.target = "_blank";
            a.rel = "noreferrer";
            a.click();
          }}
        />
      ) : null}

      <CaptionsDisplay
        captionsText={captionsText}
        onCopy={async () => {
          await navigator.clipboard.writeText(captionsText);
          onToast("SRT copied.", "success");
        }}
        onDownload={() => {
          const blob = new Blob([captionsText], { type: "text/plain" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "pixii-ugc-captions.srt";
          a.click();
          URL.revokeObjectURL(a.href);
        }}
      />
    </div>
  );
}
