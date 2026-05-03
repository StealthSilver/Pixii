"use client";

import { useRef, useState } from "react";
import type { RoasterJobView } from "./types";

function gradeCircleClass(letter: string): string {
  switch (letter.toUpperCase()) {
    case "A":
      return "bg-emerald-500 text-white ring-emerald-200";
    case "B":
      return "bg-sky-600 text-white ring-sky-200";
    case "C":
      return "bg-amber-500 text-white ring-amber-200";
    case "D":
      return "bg-orange-500 text-white ring-orange-200";
    default:
      return "bg-red-600 text-white ring-red-200";
  }
}

type CritiqueVideoTabProps = {
  job: RoasterJobView;
};

export function CritiqueVideoTab({ job }: CritiqueVideoTabProps) {
  const { listingScore, critiqueScript, voiceoverUrl, avatarFrameUrls, finalVideoUrl } =
    job;
  const lg = listingScore.letterGrade.toUpperCase();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [capOpen, setCapOpen] = useState(false);
  const [copyShare, setCopyShare] = useState(false);

  const downloadScript = () => {
    const text = critiqueScript.fullScript ?? "";
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roaster-critique-script.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(job.shareableLink);
    setCopyShare(true);
    window.setTimeout(() => setCopyShare(false), 2000);
  };

  const downloadMp3 = async () => {
    const res = await fetch(voiceoverUrl);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roaster-voiceover.mp3";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const zipFrames = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (let i = 0; i < avatarFrameUrls.length; i++) {
      const u = avatarFrameUrls[i];
      const res = await fetch(u);
      const buf = await res.arrayBuffer();
      const ext = u.includes(".png") ? "png" : "jpg";
      zip.file(`frame_${i + 1}.${ext}`, buf);
    }
    const out = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = "roaster-avatar-frames.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasVideo = Boolean(finalVideoUrl?.trim());

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className={
              "flex size-28 items-center justify-center rounded-full text-5xl font-heading font-bold shadow-md ring-4 " +
              gradeCircleClass(lg)
            }
            aria-label={`Grade ${lg}`}
          >
            {lg}
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-black">
            {listingScore.overallScore}/100
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Estimated conversion rate: {listingScore.conversionEstimate || "—"}
          </p>
        </div>
      </section>

      {hasVideo ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <video
            controls
            style={{ maxWidth: 400 }}
            className="mx-auto w-full rounded-lg"
          >
            <source src={finalVideoUrl} type="video/mp4" />
          </video>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={finalVideoUrl}
              download
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:flex-none"
            >
              Download Video
            </a>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
            >
              {copyShare ? "Copied!" : "Copy Share Link"}
            </button>
            <button
              type="button"
              onClick={downloadScript}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
            >
              Download Script
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-black">
              🎬 Your Critique Package
            </h3>
            <div className="mx-auto mt-4 flex max-w-[300px] justify-center">
              {avatarFrameUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarFrameUrls[0]}
                  alt=""
                  width={300}
                  height={400}
                  className="max-h-[400px] w-full max-w-[300px] rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="flex h-[280px] w-[220px] items-center justify-center rounded-xl bg-neutral-200 text-xs text-neutral-600">
                  No preview image
                </div>
              )}
            </div>
            <audio
              ref={audioRef}
              controls
              className="mt-4 w-full"
              src={voiceoverUrl}
            >
              <source src={voiceoverUrl} />
            </audio>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50"
              >
                {copyShare ? "Copied!" : "Copy Share Link"}
              </button>
              <button
                type="button"
                onClick={() => void downloadMp3()}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50"
              >
                Download MP3
              </button>
              {avatarFrameUrls.length > 1 ? (
                <button
                  type="button"
                  onClick={() => void zipFrames()}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-50"
                >
                  Download Avatar Frames (ZIP)
                </button>
              ) : (
                avatarFrameUrls.map((u, i) => (
                  <a
                    key={u}
                    href={u}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-neutral-50"
                  >
                    Frame {i + 1}
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setCapOpen((o) => !o)}
              className="flex w-full items-center justify-between text-left font-heading text-sm font-semibold text-black"
            >
              Assemble in CapCut — 4 steps
              <span className="text-neutral-400">{capOpen ? "▲" : "▼"}</span>
            </button>
            {capOpen ? (
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-neutral-700">
                <li>
                  Import the avatar image as a photo clip, set duration to match
                  audio length
                </li>
                <li>Import the MP3 voiceover and sync to the image clip</li>
                <li>Add auto-captions using CapCut&apos;s caption tool</li>
                <li>Export as 9:16 vertical video and share</li>
              </ol>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-xl border-y border-r border-neutral-200 border-l-4 border-l-primary bg-white p-5 shadow-sm">
        <p className="font-heading text-sm font-semibold text-black">
          What the presenter says:
        </p>
        <p className="mt-2 text-base italic text-neutral-800">
          {critiqueScript.intro}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Full script available in the Rewrites tab
        </p>
      </div>
    </div>
  );
}
