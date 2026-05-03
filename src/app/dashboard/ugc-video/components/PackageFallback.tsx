"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type PackageFallbackProps = {
  frameUrls: string[];
  voiceoverUrl: string;
  scriptPreview: string;
  onCopyScript: () => void;
  onDownloadVoice: () => void;
  onDownloadFramesZip: () => void;
};

export function PackageFallback({
  frameUrls,
  voiceoverUrl,
  scriptPreview,
  onCopyScript,
  onDownloadVoice,
  onDownloadFramesZip,
}: PackageFallbackProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-black">
        📦 Your UGC Package is Ready
      </h3>
      <p className="mt-2 text-sm text-neutral-700">
        Auto-assembly requires a video server. Here&apos;s everything you need to
        create your video in CapCut in under 5 minutes.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">🎙 Voiceover Audio</p>
          <audio
            ref={audioRef}
            controls
            className="mt-3 w-full"
            src={voiceoverUrl}
            onTimeUpdate={() => {
              const a = audioRef.current;
              if (!a?.duration) {
                return;
              }
              setProgress((a.currentTime / a.duration) * 100);
            }}
          />
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-violet-500 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onDownloadVoice}
            className="mt-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm hover:bg-neutral-50"
          >
            Download MP3
          </button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">🖼 Video Frames (4)</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {frameUrls.slice(0, 4).map((u, i) => (
              <div key={`${i}-${u.slice(-24)}`} className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                <Image
                  src={u}
                  alt={`Frame ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onDownloadFramesZip}
            className="mt-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm hover:bg-neutral-50"
          >
            Download All Frames
          </button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">📄 Script</p>
          <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{scriptPreview}</p>
          <button
            type="button"
            onClick={onCopyScript}
            className="mt-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm hover:bg-neutral-50"
          >
            Copy Script
          </button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-black">📱 CapCut Guide</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-neutral-700">
            <li>Open CapCut → New Project</li>
            <li>Import your 4 frames</li>
            <li>Set each frame to 7-8 seconds</li>
            <li>Add Audio → import voiceover MP3</li>
            <li>Add Text → paste captions</li>
          </ol>
          <a
            href="https://www.capcut.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Open CapCut
          </a>
        </div>
      </div>
    </div>
  );
}
