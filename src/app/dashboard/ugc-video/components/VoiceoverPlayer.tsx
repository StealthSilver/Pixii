"use client";

import { displayNameForVoiceId } from "@/lib/ugcVideo/voiceDisplay";

type VoiceoverPlayerProps = {
 voiceoverUrl: string;
 voiceId: string;
 onDownload?: () => void;
};

export function VoiceoverPlayer({
 voiceoverUrl,
 voiceId,
 onDownload,
}: VoiceoverPlayerProps) {
 return (
 <section className="mt-8 rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <h3 className="font-heading text-base font-semibold text-foreground">
 Voiceover Audio
 </h3>
 <div className="mt-3">
 <audio controls className="w-full">
 <source src={voiceoverUrl} />
 </audio>
 </div>
 <p className="mt-3 text-sm text-muted-foreground">
 Voice:{" "}
 <span className="font-semibold text-foreground">
 {displayNameForVoiceId(voiceId)}
 </span>
 </p>
 <p className="text-sm text-muted-foreground">Duration: ~30 seconds</p>
 {onDownload ? (
 <button
 type="button"
 onClick={onDownload}
 className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Download MP3
 </button>
 ) : null}
 </section>
 );
}
