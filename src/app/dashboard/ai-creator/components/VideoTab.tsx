"use client";

import { useRef, useState } from "react";
import { PERSONA_ROAST_ICONS } from "@/components/icons/PersonaRoastIcons";
import { PERSONAS } from "@/lib/aiCreator/personas";
import type { InfluencerPersonaId } from "@/lib/aiCreator/personas";
import type { RoastScript } from "@/lib/aiCreator/types";

const LEFT: Record<string, string> = {
 savage_sarah: "border-l-rose-500",
 brutally_honest_brad: "border-l-blue-500",
 marketing_maven_mia: "border-l-purple-500",
 conversion_king_carlos: "border-l-amber-500",
 trendy_tiffany: "border-l-teal-500",
 data_driven_david: "border-l-emerald-600",
};

type VideoTabProps = {
 personaId: InfluencerPersonaId;
 finalVideoUrl: string;
 avatarFrameUrls: string[];
 voiceoverUrl: string;
 roastScript: RoastScript | null | undefined;
 shareableLink: string;
};

export function VideoTab({
 personaId,
 finalVideoUrl,
 avatarFrameUrls,
 voiceoverUrl,
 roastScript,
 shareableLink,
}: VideoTabProps) {
 const persona = PERSONAS[personaId];
 const PersonaIcon = PERSONA_ROAST_ICONS[personaId];
 const audioRef = useRef<HTMLAudioElement>(null);
 const [progress, setProgress] = useState(0);
 const left = LEFT[personaId] ?? "border-l-rose-500";

 const downloadScript = () => {
 const text = roastScript?.fullScript ?? "";
 const blob = new Blob([text], { type: "text/plain" });
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = "roast-script.txt";
 a.click();
 URL.revokeObjectURL(a.href);
 };

 const downloadMp3 = async () => {
 const res = await fetch(voiceoverUrl);
 const blob = await res.blob();
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = "voiceover.mp3";
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
 a.download = "avatar-frames.zip";
 a.click();
 URL.revokeObjectURL(a.href);
 };

 const hasVideo = Boolean(finalVideoUrl?.trim());

 return (
 <div className="space-y-6">
 {hasVideo ? (
 <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <video
 controls
 width="100%"
 style={{ maxWidth: 400 }}
 className="mx-auto rounded-lg"
 >
 <source src={finalVideoUrl} type="video/mp4" />
 </video>
 <div className="mt-4 flex flex-wrap gap-2">
 <a
 href={finalVideoUrl}
 download
 className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 sm:flex-none"
 >
 Download video
 </a>
 <button
 type="button"
 onClick={() => {
 void navigator.clipboard.writeText(shareableLink);
 }}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
 >
 Copy share link
 </button>
 <button
 type="button"
 onClick={downloadScript}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
 >
 Download script
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
 <h3 className="font-heading text-lg font-semibold text-foreground">
 Your Roast Package
 </h3>
 <div className="mx-auto mt-4 flex max-w-[300px] justify-center">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={avatarFrameUrls[0] ?? ""}
 alt=""
 width={300}
 height={400}
 className="h-[400px] w-[300px] rounded-xl object-cover shadow-md"
 />
 </div>
 <div className="mt-4 text-center">
 <p className="font-heading text-lg font-semibold text-foreground">
 Meet {persona.name}
 </p>
 <p className="text-sm text-muted-foreground">{persona.handle}</p>
 </div>
 </div>

 <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h3 className="font-heading text-base font-semibold text-foreground">
 Download package
 </h3>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">
 <div className="rounded-lg border border-border bg-muted/50 p-4">
 <p className="text-sm font-semibold text-foreground"> Voiceover</p>
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
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-violet-500 transition-[width]"
 style={{ width: `${progress}%` }}
 />
 </div>
 <button
 type="button"
 onClick={() => void downloadMp3()}
 className="mt-3 text-sm font-semibold text-primary hover:underline"
 >
 Download MP3
 </button>
 </div>

 <div className="rounded-lg border border-border bg-muted/50 p-4">
 <p className="text-sm font-semibold text-foreground">
 Avatar frames ({avatarFrameUrls.length})
 </p>
 <div className="mt-3 grid grid-cols-2 gap-2">
 {avatarFrameUrls.slice(0, 4).map((u, i) => (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 key={u}
 src={u}
 alt={`Frame ${i + 1}`}
 className="aspect-[3/4] w-full rounded-md object-cover"
 />
 ))}
 </div>
 <button
 type="button"
 onClick={() => void zipFrames()}
 className="mt-3 text-sm font-semibold text-primary hover:underline"
 >
 Download all (ZIP)
 </button>
 </div>
 </div>

 <div className="mt-6 rounded-lg border border-border/55 bg-card p-4">
 <p className="text-sm font-semibold text-foreground">
 CapCut assembly — 5 steps
 </p>
 <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-foreground/90">
 <li>Open CapCut → New Project</li>
 <li>Import your frames</li>
 <li>Set timing to match your voiceover (~60s)</li>
 <li>Add Audio → import voiceover MP3</li>
 <li>Add captions from the roast script or paste SRT</li>
 </ol>
 </div>
 </div>
 </div>
 )}

 <div
 className={`rounded-xl border-y border-r border-border bg-card p-5 shadow-sm border-l-4 ${left}`}
 >
 <div className="flex items-start gap-3">
 <span className="flex shrink-0 text-primary" aria-hidden>
 <PersonaIcon className="size-8" />
 </span>
 <div>
 <p className="font-heading text-sm font-semibold text-foreground">
 {persona.name} says:
 </p>
 <p className="mt-2 text-base italic text-foreground">
 {roastScript?.hook ?? ""}
 </p>
 <p className="mt-2 text-xs text-muted-foreground">{persona.handle}</p>
 </div>
 </div>
 </div>
 </div>
 );
}
