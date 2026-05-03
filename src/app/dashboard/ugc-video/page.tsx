"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BetaFeatureNotice } from "@/components/BetaFeatureNotice";
import { GridBackdrop } from "@/components/GridBackdrop";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import type { PersonaConfig } from "@/lib/ugcVideo/types";
import { HistoryStrip, type HistoryStripItem } from "./components/HistoryStrip";
import { PersonaSelector } from "./components/PersonaSelector";
import { ProcessingView } from "./components/ProcessingView";
import { ScriptTab } from "./components/ScriptTab";
import { UploadView } from "./components/UploadView";
import { VideoSettings } from "./components/VideoSettings";
import { VideoTab } from "./components/VideoTab";

type View = "upload" | "configure" | "processing" | "result";

const LS_KEY = "pixii-ugc-video-settings";

type SavedSettings = {
 persona: PersonaConfig;
 scriptStyle: string;
 platform: string;
};

type GeneratedScript = {
 hook: string;
 problem: string;
 solution: string;
 cta: string;
 fullScript: string;
 durationSeconds: number;
 wordCount: number;
};

type JobPayload = {
 _id: string;
 status: string;
 currentStep: number;
 productImageUrl: string;
 productName: string;
 scriptStyle: string;
 platform: string;
 persona: PersonaConfig;
 generatedScript?: GeneratedScript | null;
 voiceId: string;
 voiceoverUrl: string;
 cloudinaryFrameUrls: string[];
 finalVideoUrl: string;
 captionsText: string;
 errorMessage?: string;
 processingTimeMs?: number | null;
};

const defaultPersona: PersonaConfig = {
 gender: "female",
 ageRange: "25-35",
 style: "casual",
 ethnicity: "not_specified",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
 const res = await fetch(url, init);
 let body: unknown = {};
 try {
 body = await res.json();
 } catch {
 body = {};
 }
 if (!res.ok) {
 const msg =
 typeof body === "object" &&
 body !== null &&
 "error" in body &&
 typeof (body as { error: unknown }).error === "string"
 ? (body as { error: string }).error
 : `Request failed (${res.status})`;
 throw new Error(msg);
 }
 return body as T;
}

async function downloadUrlAsFile(url: string, filename: string) {
 const res = await fetch(url);
 const blob = await res.blob();
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = filename;
 a.click();
 URL.revokeObjectURL(a.href);
}

function safeFilename(name: string) {
 return name.replace(/[^\w\-]+/g, "-").slice(0, 40) || "product";
}

const secondaryBtn =
  "rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

const primaryBtn =
  "w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

function segmentTabClass(active: boolean): string {
  return (
    "rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
  );
}

function resultTabClass(active: boolean): string {
  return (
    "rounded-lg px-3 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
  );
}

export default function UgcVideoPage() {
 const [view, setView] = useState<View>("upload");
 const [imageUrl, setImageUrl] = useState<string | null>(null);
 const [localPreview, setLocalPreview] = useState<string | null>(null);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [productName, setProductName] = useState("");
 const [uploading, setUploading] = useState(false);
 const [persona, setPersona] = useState<PersonaConfig>(defaultPersona);
 const [scriptStyle, setScriptStyle] = useState("honest_review");
 const [platform, setPlatform] = useState("tiktok");
 const [jobId, setJobId] = useState<string | null>(null);
 const [job, setJob] = useState<JobPayload | null>(null);
 const [elapsedSec, setElapsedSec] = useState(0);
 const [pollWarn, setPollWarn] = useState(false);
 const [resultTab, setResultTab] = useState<"video" | "script">("video");
 const [regeneratingFrames, setRegeneratingFrames] = useState(false);
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error" | "info";
 } | null>(null);
 const [mainTab, setMainTab] = useState<"create" | "history">("create");

 const { data: historyData, mutate: mutateHistory } = useSWR<{
 items: HistoryStripItem[];
 }>("/api/ugc-video/history", fetchJson, { revalidateOnFocus: true });

 useEffect(() => {
 try {
 const raw = localStorage.getItem(LS_KEY);
 if (!raw) {
 return;
 }
 const parsed = JSON.parse(raw) as Partial<SavedSettings>;
 if (parsed.persona) {
 setPersona({ ...defaultPersona, ...parsed.persona });
 }
 if (typeof parsed.scriptStyle === "string") {
 setScriptStyle(parsed.scriptStyle);
 }
 if (typeof parsed.platform === "string") {
 setPlatform(parsed.platform);
 }
 } catch {
 /* ignore */
 }
 }, []);

 useEffect(() => {
 const payload: SavedSettings = { persona, scriptStyle, platform };
 try {
 localStorage.setItem(LS_KEY, JSON.stringify(payload));
 } catch {
 /* ignore */
 }
 }, [persona, scriptStyle, platform]);

 useEffect(() => {
 return () => {
 if (localPreview?.startsWith("blob:")) {
 URL.revokeObjectURL(localPreview);
 }
 };
 }, [localPreview]);

 const refreshJob = useCallback(async () => {
 if (!jobId) {
 return;
 }
 const data = await fetchJson<JobPayload>(`/api/ugc-video/status/${jobId}`);
 setJob(data);
 }, [jobId]);

 useEffect(() => {
 if (view !== "processing" || !jobId) {
 return;
 }
 let cancelled = false;
 let ticks = 0;
 const maxPollMs = 10 * 60 * 1000;
 const start = Date.now();

 const tickHandle = window.setInterval(() => {
 setElapsedSec(Math.floor((Date.now() - start) / 1000));
 }, 1000);

 let pollHandle: number | undefined;

 function stopPollOnly() {
 if (pollHandle !== undefined) {
 window.clearInterval(pollHandle);
 pollHandle = undefined;
 }
 }

 function stopAllTimers() {
 stopPollOnly();
 window.clearInterval(tickHandle);
 }

 async function poll() {
 try {
 const data = await fetchJson<JobPayload>(`/api/ugc-video/status/${jobId}`);
 if (cancelled) {
 return;
 }
 setJob(data);
 if (data.status === "complete") {
 stopAllTimers();
 setView("result");
 void mutateHistory();
 return;
 }
 if (data.status === "failed") {
 stopAllTimers();
 return;
 }
 } catch {
 if (!cancelled) {
 setToast({ message: "Could not load job status.", variant: "error" });
 }
 }
 }

 void poll();
 pollHandle = window.setInterval(() => {
 ticks += 1;
 if (ticks * 3000 >= maxPollMs) {
 setToast({
 message:
 "Stopped polling after 10 minutes. Refresh the page or open from history if your job finished.",
 variant: "info",
 });
 stopPollOnly();
 return;
 }
 void poll();
 }, 3000);

 return () => {
 cancelled = true;
 stopAllTimers();
 };
 }, [view, jobId, mutateHistory]);

 useEffect(() => {
 if (elapsedSec >= 8 * 60) {
 setPollWarn(true);
 }
 }, [elapsedSec]);

 const onFile = useCallback((file: File | null) => {
 if (!file) {
 return;
 }
 const ok =
 file.type === "image/jpeg" ||
 file.type === "image/png" ||
 file.type === "image/webp";
 if (!ok) {
 setToast({
 message: "Only JPEG, PNG, or WebP images are allowed.",
 variant: "error",
 });
 return;
 }
 if (file.size > 10 * 1024 * 1024) {
 setToast({ message: "Image must be 10MB or smaller.", variant: "error" });
 return;
 }
 setSelectedFile(file);
 if (localPreview?.startsWith("blob:")) {
 URL.revokeObjectURL(localPreview);
 }
 setLocalPreview(URL.createObjectURL(file));
 }, [localPreview]);

 const analyzeProduct = useCallback(async () => {
 if (!selectedFile) {
 setToast({ message: "Choose an image first.", variant: "error" });
 return;
 }
 setUploading(true);
 try {
 const form = new FormData();
 form.append("file", selectedFile);
 const data = await fetchJson<{ imageUrl: string }>("/api/ugc-video/upload", {
 method: "POST",
 body: form,
 });
 setImageUrl(data.imageUrl);
 if (localPreview?.startsWith("blob:")) {
 URL.revokeObjectURL(localPreview);
 }
 setLocalPreview(null);
 setSelectedFile(null);
 setView("configure");
 setToast({ message: "Image uploaded. Configure your video.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Upload failed.",
 variant: "error",
 });
 } finally {
 setUploading(false);
 }
 }, [localPreview, selectedFile]);

 const generateVideo = useCallback(async () => {
 if (!imageUrl) {
 setToast({ message: "Missing product image.", variant: "error" });
 return;
 }
 try {
 const data = await fetchJson<{ jobId: string }>("/api/ugc-video/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 productImageUrl: imageUrl,
 productName: productName.trim() || undefined,
 persona,
 scriptStyle,
 platform,
 }),
 });
 setJobId(data.jobId);
 setJob(null);
 setElapsedSec(0);
 setPollWarn(false);
 setView("processing");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Submit failed.",
 variant: "error",
 });
 }
 }, [imageUrl, productName, persona, scriptStyle, platform]);

 const previewForUpload = imageUrl ?? localPreview;

 const jobScript = useMemo(() => {
 const g = job?.generatedScript;
 return (
 g ?? {
 hook: "",
 problem: "",
 solution: "",
 cta: "",
 fullScript: "",
 durationSeconds: 30,
 wordCount: 0,
 }
 );
 }, [job]);

 const onDownloadFramesZip = useCallback(async () => {
 const urls = job?.cloudinaryFrameUrls ?? [];
 if (!urls.length) {
 return;
 }
 const JSZip = (await import("jszip")).default;
 const zip = new JSZip();
 for (let i = 0; i < urls.length; i++) {
 const res = await fetch(urls[i]);
 const blob = await res.blob();
 const ext = urls[i].toLowerCase().includes(".png") ? "png" : "jpg";
 zip.file(`frame-${i + 1}.${ext}`, blob);
 }
 const out = await zip.generateAsync({ type: "blob" });
 const a = document.createElement("a");
 a.href = URL.createObjectURL(out);
 a.download = `pixii-ugc-frames-${safeFilename(job?.productName ?? "product")}.zip`;
 a.click();
 URL.revokeObjectURL(a.href);
 }, [job]);

 const onDownloadWithCaptionsZip = useCallback(async () => {
 const video = job?.finalVideoUrl;
 if (!video?.trim()) {
 return;
 }
 const JSZip = (await import("jszip")).default;
 const zip = new JSZip();
 const v = await fetch(video);
 zip.file("video.mp4", await v.blob());
 zip.file("captions.srt", job?.captionsText ?? "");
 const out = await zip.generateAsync({ type: "blob" });
 const a = document.createElement("a");
 a.href = URL.createObjectURL(out);
 a.download = `pixii-ugc-${safeFilename(job?.productName ?? "product")}-${Date.now()}.zip`;
 a.click();
 URL.revokeObjectURL(a.href);
 }, [job]);

 const loadHistoryJob = useCallback(async (id: string) => {
 try {
 const data = await fetchJson<JobPayload>(`/api/ugc-video/status/${id}`);
 setJobId(id);
 setJob(data);
 setImageUrl(data.productImageUrl);
 setProductName(data.productName ?? "");
 setPersona(data.persona);
 setScriptStyle(data.scriptStyle);
 setPlatform(data.platform);
 setView("result");
 setMainTab("create");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not load job.",
 variant: "error",
 });
 }
 }, []);

 useEffect(() => {
 if (view === "result" && jobId && !job) {
 void refreshJob();
 }
 }, [view, jobId, job, refreshJob]);

 const runRegenerateFrames = useCallback(async () => {
 if (!jobId) {
 return;
 }
 setRegeneratingFrames(true);
 try {
 const res = await fetch("/api/ugc-video/regenerate-frames", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ jobId }),
 });
 const data = (await res.json()) as {
 frameUrls?: string[];
 error?: string;
 };
 if (!res.ok) {
 throw new Error(data.error ?? "Regenerate failed");
 }
 setJob((prev) =>
 prev
 ? {
 ...prev,
 cloudinaryFrameUrls: data.frameUrls ?? prev.cloudinaryFrameUrls,
 }
 : prev,
 );
 setToast({ message: "Frames updated.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Regenerate failed.",
 variant: "error",
 });
 } finally {
 setRegeneratingFrames(false);
 }
 }, [jobId]);

 useEffect(() => {
 if (!toast) {
 return;
 }
 const t = window.setTimeout(() => setToast(null), 3800);
 return () => window.clearTimeout(t);
 }, [toast]);

 const processingLocked = view === "processing";

 return (
 <>
 <div className="relative min-h-full overflow-x-hidden">
 <GridBackdrop />
 <div className="relative z-10 px-5 py-7 md:px-8 md:py-9">
 <BetaFeatureNotice />
 <header className="border-b border-border/70 pb-6">
 <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
 Content
 </p>
 <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
 UGC video
 </h1>
 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
 Turn a product photo into a ~30s UGC-style video with voiceover, frames,
 and captions—styled for short-form platforms.
 </p>
 </header>

 <div
 className="mt-8 inline-flex rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
 role="tablist"
 aria-label="UGC sections"
 >
 <button
 type="button"
 role="tab"
 aria-selected={mainTab === "create"}
 className={segmentTabClass(mainTab === "create")}
 onClick={() => setMainTab("create")}
 >
 Create
 </button>
 <button
 type="button"
 role="tab"
 aria-selected={mainTab === "history"}
 disabled={processingLocked}
 className={
 segmentTabClass(mainTab === "history") +
 (processingLocked ? " cursor-not-allowed opacity-50" : "")
 }
 onClick={() => {
 if (!processingLocked) {
 setMainTab("history");
 }
 }}
 >
 History
 </button>
 </div>

 <div className="mt-8 max-w-6xl space-y-6">
 {mainTab === "history" ? (
 <>
 {(historyData?.items ?? []).length === 0 ? (
 <p className="text-sm text-muted-foreground">
 No videos yet. Create one from the Create tab.
 </p>
 ) : (
 <>
 <p className="text-sm text-muted-foreground">
 Open a past video for downloads and script.
 </p>
 <ul className="space-y-2">
 {(historyData?.items ?? []).map((h) => (
 <li key={h._id}>
 <button
 type="button"
 onClick={() => void loadHistoryJob(h._id)}
 className="flex w-full items-center gap-3 rounded-xl border border-border/80 bg-card/95 px-4 py-3 text-left shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-primary/25 dark:ring-white/[0.05]"
 >
 <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
 <Image
 src={h.cloudinaryFrameUrls?.[0] ?? h.productImageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 </div>
 <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
 {h.productName || "Product"}
 </span>
 </button>
 </li>
 ))}
 </ul>
 </>
 )}
 </>
 ) : (
 <>
 {view === "upload" && (
 <>
 <UploadView
 productName={productName}
 onProductNameChange={setProductName}
 previewUrl={previewForUpload}
 uploading={uploading}
 onFile={onFile}
 />
 <button
 type="button"
 disabled={uploading || !selectedFile}
 onClick={() => void analyzeProduct()}
 className={primaryBtn + " mt-6"}
 >
 {uploading ? "Uploading…" : "Analyze product →"}
 </button>
 </>
 )}

 {view === "configure" && (
 <div className="space-y-6">
 <button
 type="button"
 onClick={() => {
 setView("upload");
 setImageUrl(null);
 }}
 className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
 >
 ← Back
 </button>

 <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
 {imageUrl ? (
 <Image
 src={imageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 ) : null}
 </div>
 <p className="text-sm font-semibold text-foreground">
 {productName.trim() || "Your product"}
 </p>
 </div>

 <div className="grid gap-6 lg:grid-cols-2">
 <PersonaSelector persona={persona} onChange={setPersona} />
 <VideoSettings
 scriptStyle={scriptStyle}
 onScriptStyleChange={setScriptStyle}
 platform={platform}
 onPlatformChange={setPlatform}
 />
 </div>

 <button
 type="button"
 onClick={() => void generateVideo()}
 className={primaryBtn}
 >
 Generate UGC video →
 </button>
 </div>
 )}

 {view === "processing" && jobId && (
 <ProcessingView
 thumbnailUrl={imageUrl}
 productName={job?.productName?.trim() || productName}
 scriptStyle={scriptStyle}
 platform={platform}
 status={job?.status ?? "queued"}
 currentStep={job?.currentStep ?? 0}
 errorMessage={job?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 pollWarn
 longWaitHint={pollWarn}
 onTryAgain={() => {
 setView("configure");
 setJobId(null);
 setJob(null);
 }}
 />
 )}

 {view === "result" && job && (
 <div className="space-y-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="relative size-10 overflow-hidden rounded-md border border-border bg-muted">
 {job.productImageUrl ? (
 <Image
 src={job.productImageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 ) : null}
 </div>
 <span className="text-sm font-semibold text-foreground">
 {job.productName || "Product"}
 </span>
 </div>
 <button
 type="button"
 onClick={() => {
 setView("upload");
 setJobId(null);
 setJob(null);
 setImageUrl(null);
 setProductName("");
 setLocalPreview(null);
 setSelectedFile(null);
 setResultTab("video");
 setMainTab("create");
 }}
 className={secondaryBtn + " shrink-0 px-4 py-2 text-sm"}
 >
 Create another
 </button>
 </div>

 <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25">
 <button
 type="button"
 onClick={() => setResultTab("video")}
 className={resultTabClass(resultTab === "video")}
 >
 Video & frames
 </button>
 <button
 type="button"
 onClick={() => setResultTab("script")}
 className={resultTabClass(resultTab === "script")}
 >
 Script & captions
 </button>
 </div>

 {resultTab === "video" ? (
 <VideoTab
 finalVideoUrl={job.finalVideoUrl ?? ""}
 frameUrls={job.cloudinaryFrameUrls ?? []}
 voiceoverUrl={job.voiceoverUrl ?? ""}
 scriptFull={jobScript.fullScript}
 regenerating={regeneratingFrames}
 onRegenerateFrames={() => void runRegenerateFrames()}
 onDownloadVideo={() =>
 void downloadUrlAsFile(
 job.finalVideoUrl,
 `pixii-ugc-${safeFilename(job.productName)}-${Date.now()}.mp4`,
 )
 }
 onDownloadWithCaptionsZip={() => void onDownloadWithCaptionsZip()}
 onDownloadFrame={(url, i) =>
 void downloadUrlAsFile(
 url,
 `pixii-ugc-frame-${i + 1}-${Date.now()}.jpg`,
 )
 }
 onDownloadFramesZip={() => void onDownloadFramesZip()}
 onDownloadVoice={() =>
 void downloadUrlAsFile(
 job.voiceoverUrl,
 `pixii-ugc-voiceover-${Date.now()}.mp3`,
 )
 }
 onCopyScript={async () => {
 await navigator.clipboard.writeText(jobScript.fullScript);
 setToast({ message: "Script copied.", variant: "success" });
 }}
 />
 ) : (
 <ScriptTab
 jobId={jobId ?? ""}
 script={jobScript}
 voiceoverUrl={job.voiceoverUrl ?? ""}
 voiceId={job.voiceId ?? ""}
 captionsText={job.captionsText ?? ""}
 onJobRefresh={refreshJob}
 onToast={(m, v) => setToast({ message: m, variant: v })}
 />
 )}

 <HistoryStrip
 items={historyData?.items ?? []}
 onSelect={(id) => void loadHistoryJob(id)}
 />
 </div>
 )}
 </>
 )}
 </div>
 </div>
 </div>

 {toast ? (
 <Toast
 message={toast.message}
 variant={toast.variant}
 onDismiss={() => setToast(null)}
 />
 ) : null}
 </>
 );
}
