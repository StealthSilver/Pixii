"use client";

type CaptionsDisplayProps = {
  captionsText: string;
  onCopy: () => void;
  onDownload: () => void;
};

export function CaptionsDisplay({
  captionsText,
  onCopy,
  onDownload,
}: CaptionsDisplayProps) {
  return (
    <section className="mt-8">
      <h3 className="font-heading text-base font-semibold text-black">
        Captions (SRT)
      </h3>
      <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs text-neutral-800">
        {captionsText || "—"}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          Copy SRT
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          Download .srt
        </button>
      </div>
    </section>
  );
}
