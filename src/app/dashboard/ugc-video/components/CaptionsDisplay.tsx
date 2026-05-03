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
 <h3 className="font-heading text-base font-semibold text-foreground">
 Captions (SRT)
 </h3>
 <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-muted p-4 font-mono text-xs text-foreground ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 {captionsText || "—"}
 </pre>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={onCopy}
 className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Copy SRT
 </button>
 <button
 type="button"
 onClick={onDownload}
 className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Download .srt
 </button>
 </div>
 </section>
 );
}
