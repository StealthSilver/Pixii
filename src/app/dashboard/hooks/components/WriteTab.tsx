"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { HookPatternJson } from "../types";

const PLATFORMS = ["Twitter", "Instagram", "TikTok", "LinkedIn"] as const;
const TONES = ["Casual", "Bold", "Educational", "Playful"] as const;

export type WriteTabHandle = {
  scrollToTop: () => void;
};

type WriteTabProps = {
  patterns: HookPatternJson[];
  selectedPattern: HookPatternJson | null;
  onSelectPattern: (p: HookPatternJson | null) => void;
  onToast: (message: string, variant: "success" | "error") => void;
  onDraftSaved: () => void;
};

function pillClass(active: boolean): string {
  return (
    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/35 hover:text-foreground")
  );
}

function VariationSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/80 p-4 animate-pulse">
            <div className="h-3 w-[75%] rounded bg-border" />
      <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-[83%] rounded bg-border" />
    </div>
  );
}

export const WriteTab = forwardRef<WriteTabHandle, WriteTabProps>(
  function WriteTab(
    {
      patterns,
      selectedPattern,
      onSelectPattern,
      onToast,
      onDraftSaved,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [topic, setTopic] = useState("");
    const [platform, setPlatform] =
      useState<(typeof PLATFORMS)[number]>("Twitter");
    const [tone, setTone] = useState<(typeof TONES)[number]>("Casual");
    const [generating, setGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [variations, setVariations] = useState<string[] | null>(null);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [savingIdx, setSavingIdx] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    }));

    useEffect(() => {
      if (copiedIdx === null) {
        return;
      }
      const t = window.setTimeout(() => setCopiedIdx(null), 2000);
      return () => window.clearTimeout(t);
    }, [copiedIdx]);

    const handleGenerate = useCallback(async () => {
      if (!selectedPattern) {
        onToast("Select a hook pattern first.", "error");
        return;
      }
      if (!topic.trim()) {
        onToast("Add a topic to generate posts.", "error");
        return;
      }
      setGenerating(true);
      setGenerateError(null);
      setVariations(null);
      try {
        const res = await fetch("/api/hooks/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patternName: selectedPattern.name,
            patternDescription: selectedPattern.description,
            exampleHooks: selectedPattern.exampleHooks,
            topic: topic.trim(),
            platform,
            tone,
          }),
        });
        const data = (await res.json()) as {
          variations?: string[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Generation failed");
        }
        if (!data.variations?.length) {
          throw new Error("No variations returned");
        }
        setVariations(data.variations);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generation failed";
        setGenerateError(msg);
        onToast(msg, "error");
      } finally {
        setGenerating(false);
      }
    }, [onToast, platform, selectedPattern, tone, topic]);

    const copyText = async (text: string, idx: number) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
      } catch {
        onToast("Could not copy — try again.", "error");
      }
    };

    const saveDraft = async (text: string, idx: number) => {
      if (!selectedPattern) {
        return;
      }
      setSavingIdx(idx);
      try {
        const title =
          text.split("\n")[0]?.slice(0, 80).trim() ||
          `${selectedPattern.name} draft`;
        const res = await fetch("/api/hooks/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: text,
            platform,
            tone,
            patternId: selectedPattern._id,
            patternName: selectedPattern.name,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Save failed");
        }
        onToast("Saved to Drafts", "success");
        onDraftSaved();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed";
        onToast(msg, "error");
      } finally {
        setSavingIdx(null);
      }
    };

    const showEmpty = !generating && !variations?.length;

    return (
      <div ref={rootRef} className="scroll-mt-6">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pattern
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <select
                  value={selectedPattern?._id ?? ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const p = patterns.find((x) => x._id === id) ?? null;
                    onSelectPattern(p);
                  }}
                  className="min-h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
                >
                  <option value="">Choose a pattern…</option>
                  {patterns.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedPattern ? (
                  <button
                    type="button"
                    onClick={() => onSelectPattern(null)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              {selectedPattern ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedPattern.description}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="hook-topic"
                className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Topic
              </label>
              <input
                id="hook-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Pixii's AI photo tool"
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Platform
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={pillClass(platform === p)}
                    onClick={() => setPlatform(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tone
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={pillClass(tone === t)}
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {generateError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {generateError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {generating ? "Generating…" : "Generate Posts →"}
            </button>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm min-h-[280px]">
              {generating ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Crafting variations…
                  </p>
                  <VariationSkeleton />
                  <VariationSkeleton />
                  <VariationSkeleton />
                </div>
              ) : variations && variations.length ? (
                <ul className="space-y-4">
                  {variations.map((text, idx) => {
                    const count = text.length;
                    const overTwitter = count > 280;
                    return (
                      <li
                        key={idx}
                        className="rounded-xl border border-border/80 bg-background p-4"
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {text}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums " +
                              (overTwitter
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-border bg-muted text-foreground/90")
                            }
                          >
                            {count} chars
                          </span>
                          <button
                            type="button"
                            onClick={() => void copyText(text, idx)}
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
                          >
                            {copiedIdx === idx ? "Copied!" : "Copy"}
                          </button>
                          <button
                            type="button"
                            disabled={savingIdx === idx || !selectedPattern}
                            onClick={() => void saveDraft(text, idx)}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40"
                          >
                            {savingIdx === idx ? "Saving…" : "Save to Drafts"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : showEmpty ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center">
                  <svg
                    className="size-10 text-muted-foreground/55"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <p className="font-heading text-base font-semibold text-foreground">
                    Select a pattern and topic to generate posts
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Pick a hook from the dropdown, describe what you want to
                    talk about, then generate three platform-native drafts.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
