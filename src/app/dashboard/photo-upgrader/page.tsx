"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { BetaFeatureNotice } from "@/components/BetaFeatureNotice";
import { GridBackdrop } from "@/components/GridBackdrop";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

type View = "upload" | "processing" | "result";

type JobStatusResponse = {
 jobId: string;
 status: string;
 currentStep: number;
 originalUrl: string | null;
 upscaledUrl: string | null;
 transparentUrl: string | null;
 outputUrl: string | null;
 errorMessage: string | null;
 processingTimeMs: number | null;
 backgroundStyle: string;
};

type HistoryItem = {
 _id: string;
 originalUrl: string;
 outputUrl: string;
 backgroundStyle: string;
 processingTimeMs: number | null;
 createdAt: string;
};

const BG_OPTIONS = ["white", "grey", "beige", "black", "navy", "sage"] as const;
const SIZE_OPTIONS = ["1000", "2000", "3000"] as const;

const STEP_LABELS = [
 "Upscale & sharpen",
 "Remove background",
 "Studio background",
 "Relight & polish",
 "Finalize",
] as const;

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

const primaryBtn =
 "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 disabled:cursor-not-allowed disabled:opacity-60 dark:ring-white/15";

const secondaryBtn =
 "rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

function stepProgress(status: string, currentStep: number): {
 activeIndex: number;
 allComplete: boolean;
 failed: boolean;
} {
 if (status === "failed") {
 return { activeIndex: -1, allComplete: false, failed: true };
 }
 if (status === "complete") {
 return { activeIndex: STEP_LABELS.length, allComplete: true, failed: false };
 }
 const map: Record<string, number> = {
 queued: 0,
 upscaling: 0,
 removing_bg: 1,
 generating_bg: 2,
 relighting: 3,
 };
 const idx =
 map[status] ??
 (currentStep >= 1 ? Math.min(currentStep - 1, STEP_LABELS.length - 1) : 0);
 return { activeIndex: idx, allComplete: false, failed: false };
}

export default function PhotoUpgraderPage() {
 const [view, setView] = useState<View>("upload");
 const [jobId, setJobId] = useState<string | null>(null);
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);
 const [remoteUrl, setRemoteUrl] = useState("");
 const [uploading, setUploading] = useState(false);
 const [backgroundStyle, setBackgroundStyle] =
 useState<(typeof BG_OPTIONS)[number]>("white");
 const [useAiBackground, setUseAiBackground] = useState(false);
 const [outputSize, setOutputSize] =
 useState<(typeof SIZE_OPTIONS)[number]>("2000");
 const [relightEnabled, setRelightEnabled] = useState(true);
 const [statusPayload, setStatusPayload] = useState<JobStatusResponse | null>(
 null,
 );
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error";
 } | null>(null);

 const {
 data: historyData,
 error: historyError,
 mutate: mutateHistory,
 isLoading: historyLoading,
 } = useSWR<{ items: HistoryItem[] }>(
 "/api/photo-upgrader/history",
 fetchJson,
 { revalidateOnFocus: true },
 );

 const pollUrl = jobId ? `/api/photo-upgrader/status/${jobId}` : null;

 const resetUpload = useCallback(() => {
 setJobId(null);
 setPreviewUrl(null);
 setRemoteUrl("");
 setStatusPayload(null);
 setView("upload");
 }, []);

 useEffect(() => {
 if (!pollUrl || view !== "processing") {
 return;
 }
 let cancelled = false;

 async function poll() {
 const url = pollUrl;
 if (!url) {
 return;
 }
 try {
 const data = await fetchJson<JobStatusResponse>(url);
 if (cancelled) {
 return;
 }
 setStatusPayload(data);
 if (data.status === "complete") {
 setView("result");
 void mutateHistory();
 }
 if (data.status === "failed") {
 setToast({
 message: data.errorMessage ?? "Processing failed.",
 variant: "error",
 });
 resetUpload();
 }
 } catch {
 if (!cancelled) {
 setToast({
 message: "Could not load job status.",
 variant: "error",
 });
 }
 }
 }

 poll();
 const id = window.setInterval(poll, 2000);
 return () => {
 cancelled = true;
 window.clearInterval(id);
 };
 }, [pollUrl, view, resetUpload, mutateHistory]);

 const progress = useMemo(() => {
 if (!statusPayload) {
 return stepProgress("upscaling", 1);
 }
 return stepProgress(statusPayload.status, statusPayload.currentStep);
 }, [statusPayload]);

 const onFile = useCallback(async (file: File | null) => {
 if (!file || !file.type.startsWith("image/")) {
 setToast({ message: "Choose an image file.", variant: "error" });
 return;
 }
 setUploading(true);
 try {
 const form = new FormData();
 form.append("file", file);
 const data = await fetchJson<{ jobId: string; originalUrl: string }>(
 "/api/photo-upgrader/upload",
 { method: "POST", body: form },
 );
 setJobId(data.jobId);
 setPreviewUrl(data.originalUrl);
 setToast({ message: "Image uploaded. Adjust options and start.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Upload failed.",
 variant: "error",
 });
 } finally {
 setUploading(false);
 }
 }, []);

 const onUploadFromUrl = useCallback(async () => {
 const url = remoteUrl.trim();
 if (!url.startsWith("http")) {
 setToast({ message: "Enter a valid http(s) image URL.", variant: "error" });
 return;
 }
 setUploading(true);
 try {
 const data = await fetchJson<{ jobId: string; originalUrl: string }>(
 "/api/photo-upgrader/upload",
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ imageUrl: url }),
 },
 );
 setJobId(data.jobId);
 setPreviewUrl(data.originalUrl);
 setToast({ message: "Image imported. Adjust options and start.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Import failed.",
 variant: "error",
 });
 } finally {
 setUploading(false);
 }
 }, [remoteUrl]);

 const startProcessing = useCallback(async () => {
 if (!jobId) {
 return;
 }
 try {
 await fetchJson("/api/photo-upgrader/process", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 jobId,
 backgroundStyle,
 useAiBackground,
 outputSize,
 relightEnabled,
 }),
 });
 setStatusPayload(null);
 setView("processing");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not start processing.",
 variant: "error",
 });
 }
 }, [jobId, backgroundStyle, useAiBackground, outputSize, relightEnabled]);

 const deleteHistoryItem = useCallback(
 async (id: string) => {
 try {
 await fetchJson(`/api/photo-upgrader/history/${id}`, {
 method: "DELETE",
 });
 await mutateHistory();
 setToast({ message: "Removed from history.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Delete failed.",
 variant: "error",
 });
 }
 },
 [mutateHistory],
 );

 const inputClass =
 "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

 const dropHandlers = {
 onDragOver: (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 },
 onDrop: (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 const f = e.dataTransfer.files?.[0];
 if (f) {
 void onFile(f);
 }
 },
 };

 return (
 <>
 <div className="relative min-h-full overflow-x-hidden">
 <GridBackdrop />
 <div className="relative z-10 px-5 py-7 md:px-8 md:py-9">
 <BetaFeatureNotice />
 <header className="border-b border-border/70 pb-6">
 <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
 Studio
 </p>
 <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
 Photo Upgrader
 </h1>
 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
 Turn low-res, poorly lit product photos into studio-quality shots: upscale,
 remove the background, apply a clean studio backdrop, then relight and polish.
 </p>
 </header>

 <div className="mt-8 grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]">
 <div className="space-y-6">
 {view === "upload" && (
 <section
 className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
 aria-labelledby="pu-upload-heading"
 >
 <h2
 id="pu-upload-heading"
 className="font-heading text-lg font-semibold text-foreground"
 >
 Upload product photo
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Drop an image or paste an image URL. We upload to secure storage
 and run the enhancement pipeline when you start.
 </p>

 <div
 {...dropHandlers}
 className="mt-5 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/60 px-4 py-8 text-center ring-1 ring-black/[0.03] transition-colors hover:border-primary/30 hover:bg-muted/80 dark:bg-muted/40 dark:ring-white/[0.05]"
 >
 <label className="cursor-pointer text-sm font-semibold text-primary">
 <input
 type="file"
 accept="image/*"
 className="sr-only"
 disabled={uploading}
 onChange={(e) => {
 const f = e.target.files?.[0];
 void onFile(f ?? null);
 e.target.value = "";
 }}
 />
 Choose file
 </label>
 <p className="mt-2 text-xs text-muted-foreground">
 or drag and drop here · PNG, JPG, WebP
 </p>
 </div>

 <div className="mt-5">
 <label className="block text-sm font-medium text-foreground/90">
 Image URL
 <input
 type="url"
 value={remoteUrl}
 onChange={(e) => setRemoteUrl(e.target.value)}
 placeholder="https://example.com/product.jpg"
 className={inputClass}
 />
 </label>
 <button
 type="button"
 disabled={uploading}
 onClick={() => void onUploadFromUrl()}
 className={
 secondaryBtn + " mt-2 px-4 py-2 disabled:opacity-60"
 }
 >
 Import from URL
 </button>
 </div>

 {previewUrl && (
 <div className="mt-5 overflow-hidden rounded-lg border border-border/80 bg-muted/70 ring-1 ring-black/[0.04] dark:bg-muted/50 dark:ring-white/[0.06]">
 <div className="relative mx-auto aspect-square max-h-72 w-full max-w-sm">
 <Image
 src={previewUrl}
 alt="Uploaded preview"
 fill
 className="object-contain p-2"
 unoptimized
 />
 </div>
 </div>
 )}

 <div className="mt-6 grid gap-4 sm:grid-cols-2">
 <label className="block text-sm font-medium text-foreground/90">
 Background style
 <select
 value={backgroundStyle}
 onChange={(e) =>
 setBackgroundStyle(e.target.value as (typeof BG_OPTIONS)[number])
 }
 className={inputClass}
 >
 {BG_OPTIONS.map((o) => (
 <option key={o} value={o}>
 {o}
 </option>
 ))}
 </select>
 </label>
 <label className="block text-sm font-medium text-foreground/90">
 Output size (px)
 <select
 value={outputSize}
 onChange={(e) =>
 setOutputSize(e.target.value as (typeof SIZE_OPTIONS)[number])
 }
 className={inputClass}
 >
 {SIZE_OPTIONS.map((s) => (
 <option key={s} value={s}>
 {s} × {s}
 </option>
 ))}
 </select>
 </label>
 </div>

 <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/90">
 <input
 type="checkbox"
 checked={useAiBackground}
 onChange={(e) => setUseAiBackground(e.target.checked)}
 className="size-4 rounded border-border text-primary focus:ring-primary"
 />
 AI-generated studio background (Fal.ai)
 </label>

 <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/90">
 <input
 type="checkbox"
 checked={relightEnabled}
 onChange={(e) => setRelightEnabled(e.target.checked)}
 className="size-4 rounded border-border text-primary focus:ring-primary"
 />
 Relight & polish (Clipdrop)
 </label>

 <button
 type="button"
 disabled={!jobId || uploading}
 onClick={() => void startProcessing()}
 className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Start enhancement
 </button>
 </section>
 )}

 {view === "processing" && (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Processing
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 This usually takes a minute or two. You can leave this tab open.
 </p>

 <ol className="mt-4 space-y-2 rounded-lg border border-border bg-card/80 px-3 py-3 text-sm">
 {STEP_LABELS.map((label, i) => {
 const done =
 progress.allComplete ||
 (!progress.failed && i < progress.activeIndex);
 const running =
 !progress.allComplete &&
 !progress.failed &&
 i === progress.activeIndex;
 return (
 <li key={label} className="flex items-center gap-2 text-foreground/90">
 <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
 {done ? (
 <FaCheck className="size-3 text-emerald-600" aria-hidden />
 ) : running ? (
 <FaSpinner className="size-3 animate-spin text-primary" aria-hidden />
 ) : (
 <span className="size-2 rounded-full bg-border" aria-hidden />
 )}
 </span>
 <span className={done ? "font-medium text-foreground" : ""}>
 {label}
 </span>
 </li>
 );
 })}
 </ol>

 {statusPayload?.status === "failed" && statusPayload.errorMessage ? (
 <p className="mt-4 rounded-lg border border-red-200/90 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200">
 {statusPayload.errorMessage}
 </p>
 ) : null}

 <button
 type="button"
 onClick={resetUpload}
 className="mt-5 text-sm font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
 >
 Cancel and upload a different image
 </button>
 </section>
 )}

 {view === "result" && statusPayload?.outputUrl && (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Result
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 {statusPayload.processingTimeMs != null
 ? `Done in ${(statusPayload.processingTimeMs / 1000).toFixed(1)}s · `
 : null}
 Background: {statusPayload.backgroundStyle}
 </p>
 <div className="mt-4 overflow-hidden rounded-lg border border-border/80 bg-muted/70 ring-1 ring-black/[0.04] dark:bg-muted/50 dark:ring-white/[0.06]">
 <div className="relative mx-auto aspect-square max-h-[min(80vh,560px)] w-full">
 <Image
 src={statusPayload.outputUrl}
 alt="Enhanced product"
 fill
 className="object-contain p-2"
 unoptimized
 priority
 />
 </div>
 </div>
 <div className="mt-5 flex flex-wrap gap-3">
 <a
 href={statusPayload.outputUrl}
 download
 target="_blank"
 rel="noreferrer"
 className={primaryBtn}
 >
 Open full size
 </a>
 <button
 type="button"
 onClick={resetUpload}
 className={secondaryBtn}
 >
 Process another photo
 </button>
 </div>
 </section>
 )}
 </div>

 <aside className="space-y-4">
 <section className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <h3 className="font-heading text-sm font-semibold text-foreground">
 Recent outputs
 </h3>
 {historyError ? (
 <p className="mt-2 text-sm text-red-700 dark:text-red-300">{historyError.message}</p>
 ) : null}
 {historyLoading && !historyData?.items?.length ? (
 <div className="mt-3 space-y-2">
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 className="h-16 animate-pulse rounded-lg bg-muted dark:bg-muted/60"
 />
 ))}
 </div>
 ) : !historyData?.items?.length ? (
 <p className="mt-2 text-sm text-muted-foreground">
 Completed jobs will appear here.
 </p>
 ) : (
 <ul className="mt-3 space-y-3">
 {historyData.items.map((item) => (
 <li
 key={item._id}
 className="flex gap-3 rounded-lg border border-border/80 bg-card/80 p-2 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
 >
 <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 {item.outputUrl ? (
 <Image
 src={item.outputUrl}
 alt=""
 fill
 sizes="56px"
 className="object-cover"
 unoptimized
 />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-xs font-semibold text-foreground">
 {item.backgroundStyle} ·{" "}
 {item.processingTimeMs != null
 ? `${(item.processingTimeMs / 1000).toFixed(1)}s`
 : "—"}
 </p>
 <p className="text-[11px] text-muted-foreground">
 {formatRelativeTime(item.createdAt)}
 </p>
 <button
 type="button"
 onClick={() => void deleteHistoryItem(item._id)}
 className="mt-1 text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400"
 >
 Delete
 </button>
 </div>
 </li>
 ))}
 </ul>
 )}
 </section>

 <section className="rounded-xl border border-dashed border-border/80 bg-card/70 px-4 py-4 text-sm text-muted-foreground ring-1 ring-black/[0.03] dark:bg-card/50 dark:ring-white/[0.05]">
 <p className="font-heading font-semibold text-foreground">Pipeline</p>
 <ol className="mt-2 list-decimal space-y-1 pl-4">
 <li>Upscale (Replicate Real-ESRGAN)</li>
 <li>Background removal (Remove.bg)</li>
 <li>Studio backdrop (preset or Fal.ai)</li>
 <li>Optional relight (Clipdrop)</li>
 <li>Finalize &amp; deliver</li>
 </ol>
 </section>
 </aside>
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
