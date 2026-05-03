"use client";

import { useEffect } from "react";

const TUTORIAL_EMBED_SRC =
  "https://www.youtube.com/embed/zlwB2pD9MXQ?autoplay=1&rel=0&modestbranding=1&playsinline=1";

type TutorialVideoOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function TutorialVideoOverlay({ open, onClose }: TutorialVideoOverlayProps) {
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
        aria-labelledby="hooks-tutorial-video-title"
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4 md:px-6">
          <h2
            id="hooks-tutorial-video-title"
            className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl"
          >
            Tutorial video
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
            title="Hooks tutorial — YouTube video"
            src={TUTORIAL_EMBED_SRC}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
