"use client";

import { PackageFallback } from "./PackageFallback";
import { FramesGallery } from "./FramesGallery";

type VideoTabProps = {
  finalVideoUrl: string;
  frameUrls: string[];
  voiceoverUrl: string;
  scriptFull: string;
  regenerating: boolean;
  onRegenerateFrames: () => void;
  onDownloadVideo: () => void;
  onDownloadWithCaptionsZip: () => void;
  onDownloadFrame: (url: string, index: number) => void;
  onDownloadFramesZip: () => void;
  onDownloadVoice: () => void;
  onCopyScript: () => void;
};

export function VideoTab({
  finalVideoUrl,
  frameUrls,
  voiceoverUrl,
  scriptFull,
  regenerating,
  onRegenerateFrames,
  onDownloadVideo,
  onDownloadWithCaptionsZip,
  onDownloadFrame,
  onDownloadFramesZip,
  onDownloadVoice,
  onCopyScript,
}: VideoTabProps) {
  const hasVideo = Boolean(finalVideoUrl?.trim());
  const previewLines = scriptFull
    .split("\n")
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return (
    <div>
      {hasVideo ? (
        <div className="flex flex-col items-center">
          <video
            controls
            className="w-full max-w-[400px] overflow-hidden rounded-xl border border-border bg-black shadow-sm"
            style={{ maxWidth: 400 }}
          >
            <source src={finalVideoUrl} type="video/mp4" />
          </video>
          <div className="mt-4 flex w-full max-w-[400px] flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onDownloadVideo}
              className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Download Video
            </button>
            <button
              type="button"
              onClick={onDownloadWithCaptionsZip}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
            >
              Download with Captions
            </button>
          </div>
        </div>
      ) : (
        <PackageFallback
          frameUrls={frameUrls}
          voiceoverUrl={voiceoverUrl}
          scriptPreview={previewLines || scriptFull.slice(0, 120)}
          onCopyScript={onCopyScript}
          onDownloadVoice={onDownloadVoice}
          onDownloadFramesZip={onDownloadFramesZip}
        />
      )}

      <FramesGallery
        frameUrls={frameUrls}
        regenerating={regenerating}
        onRegenerate={onRegenerateFrames}
        onDownloadFrame={onDownloadFrame}
      />
    </div>
  );
}
