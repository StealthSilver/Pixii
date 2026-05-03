"use client";

import { useCallback, useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { extractVideoId } from "@/lib/videoChopper/youtubeId";
import { VideoPreviewCard, type PreviewMeta } from "./VideoPreviewCard";

const LS_CLIPS = "pixii_clipper_num_clips";
const LS_BLOG = "pixii_clipper_blog";

const EXAMPLES: { label: string; url: string }[] = [
  {
    label: "How to Build a Business",
    url: "https://www.youtube.com/watch?v=HC4YO_96hjE",
  },
  {
    label: "The Science of Productivity",
    url: "https://www.youtube.com/watch?v=yXNf9t7YKsQ",
  },
  {
    label: "Marketing Strategies That Work",
    url: "https://www.youtube.com/watch?v=sPVvXDqMjtk",
  },
];

async function fetchPreview(url: string): Promise<PreviewMeta> {
  const res = await fetch(
    `/api/video-chopper/preview?url=${encodeURIComponent(url)}`,
  );
  const body = (await res.json()) as { error?: string } & Partial<PreviewMeta>;
  if (!res.ok) {
    throw new Error(
      typeof body.error === "string" ? body.error : "Preview failed.",
    );
  }
  return body as PreviewMeta;
}

type VideoInputProps = {
  onSubmit: (payload: {
    youtubeUrl: string;
    numberOfClips: number;
    includeBlogPost: boolean;
  }) => void;
  busy: boolean;
};

export function VideoInput({ onSubmit, busy }: VideoInputProps) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [meta, setMeta] = useState<PreviewMeta | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [numberOfClips, setNumberOfClips] = useState(5);
  const [includeBlogPost, setIncludeBlogPost] = useState(true);

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CLIPS);
      if (c === "3" || c === "5" || c === "8") {
        setNumberOfClips(Number(c));
      }
      const b = localStorage.getItem(LS_BLOG);
      if (b === "0") {
        setIncludeBlogPost(false);
      }
      if (b === "1") {
        setIncludeBlogPost(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CLIPS, String(numberOfClips));
    } catch {
      /* ignore */
    }
  }, [numberOfClips]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_BLOG, includeBlogPost ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [includeBlogPost]);

  const runPreview = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setMeta(null);
      setPreviewErr(null);
      setUrlError(null);
      return;
    }
    const lower = trimmed.toLowerCase();
    if (!lower.includes("youtube.com") && !lower.includes("youtu.be")) {
      setUrlError("Please enter a valid YouTube URL");
      setMeta(null);
      setPreviewErr(null);
      return;
    }
    if (!extractVideoId(trimmed)) {
      setUrlError("Please enter a valid YouTube URL");
      setMeta(null);
      setPreviewErr(null);
      return;
    }
    setUrlError(null);
    setPreviewLoading(true);
    setPreviewErr(null);
    try {
      const m = await fetchPreview(trimmed);
      setMeta(m);
    } catch (e) {
      setMeta(null);
      setPreviewErr(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runPreview(url);
    }, 400);
    return () => window.clearTimeout(t);
  }, [url, runPreview]);

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

  const durationSec = meta?.duration ?? 0;
  const tooLong = durationSec > 3600;
  const longWarning = durationSec > 30 * 60 && !tooLong;
  const canSubmit =
    Boolean(meta && extractVideoId(url) && !tooLong && !previewErr && !previewLoading);

  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby="vc-input-heading"
    >
      <h2
        id="vc-input-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Paste a YouTube link
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We download audio, transcribe with Whisper, find viral moments, and draft an SEO
        article.
      </p>

      {!url.trim() ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-foreground/90">Try with an example:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.url}
                type="button"
                onClick={() => setUrl(ex.url)}
                className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-foreground/10"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="mt-5 block text-sm font-medium text-foreground/90">
        YouTube URL
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste any YouTube URL..."
          className={`${inputClass} h-[52px]`}
          autoComplete="off"
        />
      </label>

      {urlError ? (
        <p className="mt-2 text-sm font-medium text-red-700">{urlError}</p>
      ) : null}
      {previewErr ? (
        <p className="mt-2 text-sm font-medium text-red-700">{previewErr}</p>
      ) : null}

      {previewLoading ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <FaSpinner className="size-4 animate-spin text-primary" aria-hidden />
          Loading preview…
        </p>
      ) : null}

      {meta && !previewErr ? (
        <div className="mt-5">
          <VideoPreviewCard
            meta={meta}
            tooLong={tooLong}
            longWarning={longWarning}
          />
        </div>
      ) : null}

      {meta && extractVideoId(url) && !tooLong ? (
        <div className="mt-6 border-t border-border/55 pt-6">
          <p className="text-sm font-semibold text-foreground">Output Settings</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Number of clips</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([3, 5, 8] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumberOfClips(n)}
                    className={
                      numberOfClips === n
                        ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        : "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground/90">
                <button
                  type="button"
                  role="switch"
                  aria-checked={includeBlogPost}
                  onClick={() => setIncludeBlogPost(!includeBlogPost)}
                  className={
                    "relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors " +
                    (includeBlogPost
                      ? "border-primary/40 bg-primary"
                      : "border-border bg-border")
                  }
                >
                  <span
                    className={
                      "inline-block size-6 translate-y-0.5 rounded-full bg-card shadow transition-transform " +
                      (includeBlogPost ? "translate-x-6" : "translate-x-1")
                    }
                  />
                </button>
                Generate blog post
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canSubmit || busy}
        onClick={() =>
          onSubmit({
            youtubeUrl: url.trim(),
            numberOfClips,
            includeBlogPost,
          })
        }
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
      >
        {busy ? (
          <>
            <FaSpinner className="size-4 animate-spin" aria-hidden />
            Starting…
          </>
        ) : (
          "Chop This Video →"
        )}
      </button>
    </section>
  );
}
