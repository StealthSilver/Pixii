"use client";

import { useEffect } from "react";

/** AEO dashboard tutorial (YouTube). */
export const AEO_TUTORIAL_VIDEO_ID = "Un4-FjsG6zI";

function embedSrc(videoId: string, autoplay: boolean): string {
  const q = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${q.toString()}`;
}

type TutorialVideoOverlayProps = {
  open: boolean;
  onClose: () => void;
  /** When true, iframe loads with autoplay (first visit or after clicking Play tutorial). */
  autoplay?: boolean;
  /** Bump when opening the overlay so the iframe remounts and playback restarts. */
  iframeKey: number;
  /** YouTube embed video id. Defaults to the AEO dashboard tutorial. */
  videoId?: string;
  /** Dialog heading (shown next to Close). */
  heading?: string;
  /** `id` on the heading for `aria-labelledby`. */
  headingId?: string;
  /** Accessible title on the iframe. */
  iframeTitle?: string;
};

export function TutorialVideoOverlay({
  open,
  onClose,
  autoplay = true,
  iframeKey,
  videoId = AEO_TUTORIAL_VIDEO_ID,
  heading = "Tutorial video",
  headingId = "aeo-tutorial-video-title",
  iframeTitle = "AEO tutorial — YouTube video",
}: TutorialVideoOverlayProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/55 backdrop-blur-md transition-colors hover:bg-background/60 dark:bg-background/65 dark:hover:bg-background/70"
        aria-label="Close tutorial"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 md:px-6">
          <h2
            id={headingId}
            className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl"
          >
            {heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]"
          >
            Close
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          <iframe
            key={iframeKey}
            title={iframeTitle}
            src={embedSrc(videoId, autoplay)}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
