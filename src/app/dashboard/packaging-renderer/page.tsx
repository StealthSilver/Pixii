"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import type {
 PackageShape,
 RenderAngle,
 RenderStyle,
} from "@/lib/models/packagingJobEnums";
import { AngleSelector, ANGLE_LABELS } from "./components/AngleSelector";
import { FullscreenModal } from "./components/FullscreenModal";
import { HistoryStrip } from "./components/HistoryStrip";
import { ProcessingView } from "./components/ProcessingView";
import { PromptAccordion } from "./components/PromptAccordion";
import { RendersGallery } from "./components/RendersGallery";
import { ShapeSelector } from "./components/ShapeSelector";
import { StyleSelector, STYLE_LABELS } from "./components/StyleSelector";
import { UploadZone } from "./components/UploadZone";

type View = "upload" | "processing" | "result";

const LS_KEY = "pixii-packaging-renderer-settings";

type SavedSettings = {
 packageShape: PackageShape;
 renderStyle: RenderStyle;
 renderAngle: RenderAngle;
 dimensions: { width: number; height: number; depth: number };
};

type JobStatusResponse = {
 jobId: string;
 originalPdfUrl: string;
 flatTextureUrl: string | null;
 packageShape: PackageShape;
 packageDimensions: { width: number; height: number; depth: number };
 renderStyle: RenderStyle;
 renderAngle: RenderAngle;
 variationCount: number;
 outputUrls: string[];
 status: string;
 currentStep: number;
 renderEngine: string | null;
 promptUsed: string | null;
 errorMessage: string | null;
 processingTimeMs: number | null;
 createdAt: string;
 completedAt: string | null;
};

type HistoryItem = {
 _id: string;
 originalPdfUrl: string;
 outputUrls: string[];
 packageShape: string;
 renderStyle: string;
 processingTimeMs: number | null;
 createdAt: string;
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

async function downloadUrl(url: string, filename: string) {
 const res = await fetch(url);
 const blob = await res.blob();
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = filename;
 a.click();
 URL.revokeObjectURL(a.href);
}

async function downloadAllZip(urls: string[]) {
 const JSZip = (await import("jszip")).default;
 const zip = new JSZip();
 for (let i = 0; i < urls.length; i++) {
 const res = await fetch(urls[i]);
 const blob = await res.blob();
 const ext = urls[i].toLowerCase().includes(".png") ? "png" : "jpg";
 zip.file(`render-${i + 1}.${ext}`, blob);
 }
 const out = await zip.generateAsync({ type: "blob" });
 const a = document.createElement("a");
 a.href = URL.createObjectURL(out);
 a.download = `pixii-renders-${Date.now()}.zip`;
 a.click();
 URL.revokeObjectURL(a.href);
}

export default function PackagingRendererPage() {
 const [view, setView] = useState<View>("upload");
 const [pdfFile, setPdfFile] = useState<File | null>(null);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const [jobId, setJobId] = useState<string | null>(null);
 const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(
 null,
 );
 const [elapsedSec, setElapsedSec] = useState(0);
 const [pollWarn, setPollWarn] = useState(false);
 const [statusPayload, setStatusPayload] = useState<JobStatusResponse | null>(
 null,
 );
 const [modalOpen, setModalOpen] = useState(false);
 const [modalIndex, setModalIndex] = useState(0);
 const [busy, setBusy] = useState(false);
 const [showRegeneratePanel, setShowRegeneratePanel] = useState(false);
 const [regenStyle, setRegenStyle] = useState<RenderStyle>("studio_white");
 const [regenAngle, setRegenAngle] = useState<RenderAngle>("three_quarter");

 const [packageShape, setPackageShape] =
 useState<PackageShape>("box_rectangle");
 const [renderStyle, setRenderStyle] =
 useState<RenderStyle>("studio_white");
 const [renderAngle, setRenderAngle] =
 useState<RenderAngle>("three_quarter");
 const [variationCount, setVariationCount] = useState<1 | 2 | 4>(4);
 const [dims, setDims] = useState({ width: 10, height: 15, depth: 5 });

 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error";
 } | null>(null);

 const {
 data: historyData,
 mutate: mutateHistory,
 } = useSWR<{ items: HistoryItem[] }>(
 "/api/packaging-renderer/history",
 fetchJson,
 { revalidateOnFocus: true },
 );

 useEffect(() => {
 try {
 const raw = localStorage.getItem(LS_KEY);
 if (!raw) {
 return;
 }
 const p = JSON.parse(raw) as Partial<SavedSettings>;
 if (p.packageShape) {
 setPackageShape(p.packageShape);
 }
 if (p.renderStyle) {
 setRenderStyle(p.renderStyle);
 }
 if (p.renderAngle) {
 setRenderAngle(p.renderAngle);
 }
 if (p.dimensions && typeof p.dimensions.width === "number") {
 setDims({
 width: p.dimensions.width,
 height: p.dimensions.height ?? 15,
 depth: p.dimensions.depth ?? 5,
 });
 }
 } catch {
 /* ignore */
 }
 }, []);

 useEffect(() => {
 const payload: SavedSettings = {
 packageShape,
 renderStyle,
 renderAngle,
 dimensions: dims,
 };
 try {
 localStorage.setItem(LS_KEY, JSON.stringify(payload));
 } catch {
 /* ignore */
 }
 }, [packageShape, renderStyle, renderAngle, dims]);

 const pollUrl = jobId ? `/api/packaging-renderer/status/${jobId}` : null;

 const resetAll = useCallback(() => {
 setView("upload");
 setPdfFile(null);
 setJobId(null);
 setStatusPayload(null);
 setProcessingStartedAt(null);
 setPollWarn(false);
 setUploadError(null);
 setModalOpen(false);
 setShowRegeneratePanel(false);
 }, []);

 useEffect(() => {
 if (view !== "processing" || !processingStartedAt) {
 return;
 }
 const id = window.setInterval(() => {
 setElapsedSec(
 Math.floor((Date.now() - processingStartedAt) / 1000),
 );
 }, 1000);
 return () => window.clearInterval(id);
 }, [view, processingStartedAt]);

 useEffect(() => {
 if (view !== "processing" || !pollUrl) {
 return;
 }
 let cancelled = false;
 let intervalId: number | undefined;

 async function tick(): Promise<boolean> {
 if (cancelled) {
 return true;
 }
 try {
 const data = await fetchJson<JobStatusResponse>(pollUrl!);
 if (cancelled) {
 return true;
 }
 setStatusPayload(data);
 if (data.status === "complete") {
 setView("result");
 void mutateHistory();
 return true;
 }
 if (data.status === "failed") {
 return true;
 }
 return false;
 } catch {
 if (!cancelled) {
 setToast({
 message: "Could not load job status.",
 variant: "error",
 });
 }
 return false;
 }
 }

 void (async () => {
 const stop = await tick();
 if (stop || cancelled) {
 return;
 }
 intervalId = window.setInterval(() => {
 void tick().then((stopInner) => {
 if (stopInner && intervalId) {
 window.clearInterval(intervalId);
 }
 });
 }, 2500);
 })();

 return () => {
 cancelled = true;
 if (intervalId) {
 window.clearInterval(intervalId);
 }
 };
 }, [pollUrl, view, mutateHistory]);

 useEffect(() => {
 if (view !== "processing" || !processingStartedAt) {
 return;
 }
 const over = Date.now() - processingStartedAt > 180_000;
 setPollWarn(over);
 }, [elapsedSec, view, processingStartedAt]);

 useEffect(() => {
 if (!modalOpen || !statusPayload?.outputUrls?.length) {
 return;
 }
 const urls = statusPayload.outputUrls;
 function onKey(e: KeyboardEvent) {
 if (e.key === "Escape") {
 setModalOpen(false);
 }
 if (e.key === "ArrowLeft") {
 setModalIndex((i) => (i - 1 + urls.length) % urls.length);
 }
 if (e.key === "ArrowRight") {
 setModalIndex((i) => (i + 1) % urls.length);
 }
 }
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [modalOpen, statusPayload]);

 const inputClass =
 "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

 const onPdf = useCallback((file: File | null) => {
 setUploadError(null);
 if (!file) {
 setPdfFile(null);
 return;
 }
 if (file.type !== "application/pdf") {
 setUploadError("Please choose a PDF file.");
 setPdfFile(null);
 return;
 }
 if (file.size > 20 * 1024 * 1024) {
 setUploadError("PDF must be 20MB or smaller.");
 setPdfFile(null);
 return;
 }
 setPdfFile(file);
 }, []);

 const submitUploadAndProcess = useCallback(async () => {
 if (!pdfFile) {
 setToast({ message: "Choose a PDF first.", variant: "error" });
 return;
 }
 setBusy(true);
 setUploadError(null);
 try {
 const form = new FormData();
 form.append("file", pdfFile);
 const up = await fetchJson<{ jobId: string; originalPdfUrl: string }>(
 "/api/packaging-renderer/upload",
 { method: "POST", body: form },
 );
 setJobId(up.jobId);
 await fetchJson("/api/packaging-renderer/process", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 jobId: up.jobId,
 packageShape,
 renderStyle,
 renderAngle,
 variationCount,
 dimensions: dims,
 }),
 });
 setProcessingStartedAt(Date.now());
 setElapsedSec(0);
 setPollWarn(false);
 setStatusPayload(null);
 setView("processing");
 setToast({ message: "Processing started.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Upload failed.",
 variant: "error",
 });
 } finally {
 setBusy(false);
 }
 }, [
 pdfFile,
 packageShape,
 renderStyle,
 renderAngle,
 variationCount,
 dims,
 ]);

 const confirmRegenerate = useCallback(async () => {
 if (!jobId || !statusPayload?.flatTextureUrl) {
 setToast({
 message: "Nothing to regenerate yet.",
 variant: "error",
 });
 return;
 }
 setBusy(true);
 try {
 await fetchJson("/api/packaging-renderer/regenerate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 jobId,
 renderStyle: regenStyle,
 renderAngle: regenAngle,
 }),
 });
 setProcessingStartedAt(Date.now());
 setElapsedSec(0);
 setPollWarn(false);
 setStatusPayload(null);
 setView("processing");
 setShowRegeneratePanel(false);
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Regenerate failed.",
 variant: "error",
 });
 } finally {
 setBusy(false);
 }
 }, [jobId, statusPayload, regenStyle, regenAngle]);

 const loadHistoryJob = useCallback(
 async (id: string) => {
 try {
 const data = await fetchJson<JobStatusResponse>(
 `/api/packaging-renderer/status/${id}`,
 );
 setJobId(id);
 setStatusPayload(data);
 setView("result");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not load job.",
 variant: "error",
 });
 }
 },
 [],
 );

 const engineLabel = useMemo(() => {
 const e = statusPayload?.renderEngine;
 if (e === "fal") {
 return "FAL";
 }
 if (e === "replicate") {
 return "Replicate";
 }
 return "—";
 }, [statusPayload?.renderEngine]);

 const timeBadge = useMemo(() => {
 const ms = statusPayload?.processingTimeMs;
 if (ms == null) {
 return "—";
 }
 return `${Math.round(ms / 1000)}s`;
 }, [statusPayload?.processingTimeMs]);

 return (
 <>
 <FeaturePage
 title="Packaging Renderer"
 description="Drop in your dieline PDF and get a photorealistic 3D render of your packaging."
 >
 <div className="mt-8 max-w-3xl space-y-6">
 {view === "upload" && (
 <section
 className="rounded-xl border border-border bg-card p-5 shadow-sm"
 aria-labelledby="pr-upload-heading"
 >
 <h2
 id="pr-upload-heading"
 className="font-heading text-lg font-semibold text-foreground"
 >
 Upload dieline
 </h2>
 <div className="mt-4">
 <UploadZone
 disabled={busy}
 file={pdfFile}
 error={uploadError}
 onFile={onPdf}
 />
 </div>

 {pdfFile ? (
 <div className="mt-8 space-y-6 rounded-xl border border-border/55 bg-muted/50 p-4">
 <h3 className="font-heading text-base font-semibold text-foreground">
 Package Configuration
 </h3>
 <ShapeSelector value={packageShape} onChange={setPackageShape} />
 <div>
 <p className="text-sm font-medium text-foreground/90">
 Approximate Dimensions (cm)
 </p>
 <div className="mt-2 grid grid-cols-3 gap-3">
 <label className="text-xs font-medium text-muted-foreground">
 Width
 <input
 type="number"
 min={1}
 step={0.1}
 value={dims.width}
 onChange={(e) =>
 setDims((d) => ({
 ...d,
 width: Number(e.target.value) || 0,
 }))
 }
 className={inputClass}
 />
 </label>
 <label className="text-xs font-medium text-muted-foreground">
 Height
 <input
 type="number"
 min={1}
 step={0.1}
 value={dims.height}
 onChange={(e) =>
 setDims((d) => ({
 ...d,
 height: Number(e.target.value) || 0,
 }))
 }
 className={inputClass}
 />
 </label>
 <label className="text-xs font-medium text-muted-foreground">
 Depth
 <input
 type="number"
 min={1}
 step={0.1}
 value={dims.depth}
 onChange={(e) =>
 setDims((d) => ({
 ...d,
 depth: Number(e.target.value) || 0,
 }))
 }
 className={inputClass}
 />
 </label>
 </div>
 <p className="mt-1 text-[11px] text-muted-foreground">
 Used to improve render accuracy
 </p>
 </div>

 <StyleSelector value={renderStyle} onChange={setRenderStyle} />
 <AngleSelector value={renderAngle} onChange={setRenderAngle} />

 <div>
 <p className="text-sm font-medium text-foreground/90">
 Variations
 </p>
 <div className="mt-2 flex flex-wrap gap-2">
 {([1, 2, 4] as const).map((n) => (
 <button
 key={n}
 type="button"
 onClick={() => setVariationCount(n)}
 className={
 "rounded-full border px-4 py-1.5 text-xs font-semibold shadow-sm " +
 (variationCount === n
 ? "border-primary bg-primary/10 ring-2 ring-primary/25"
 : "border-border bg-card hover:bg-muted")
 }
 >
 {n}
 </button>
 ))}
 </div>
 <p className="mt-1 text-[11px] text-muted-foreground">
 More variations = longer processing time
 </p>
 </div>
 </div>
 ) : null}

 <div className="mt-6 rounded-xl border border-dashed border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
 <p> Estimated time: 30–60 seconds</p>
 <p className="mt-1"> Estimated cost: ~$0.08</p>
 </div>

 <button
 type="button"
 disabled={!pdfFile || busy}
 onClick={() => void submitUploadAndProcess()}
 className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Generate 3D Renders →
 </button>
 </section>
 )}

 {view === "processing" && (
 <ProcessingView
 filename={pdfFile?.name ?? null}
 packageShape={
 statusPayload?.packageShape ?? packageShape
 }
 status={statusPayload?.status ?? "extracting"}
 currentStep={statusPayload?.currentStep ?? 1}
 renderEngine={statusPayload?.renderEngine ?? null}
 errorMessage={statusPayload?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 pollWarn={pollWarn}
 onTryAgain={resetAll}
 onRefreshStatus={() => {
 if (pollUrl) {
 void fetchJson<JobStatusResponse>(pollUrl).then(setStatusPayload).catch(() =>
 setToast({ message: "Refresh failed.", variant: "error" }),
 );
 }
 }}
 />
 )}

 {view === "result" && statusPayload?.outputUrls?.length ? (
 <div className="space-y-6">
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Your renders
 </h2>
 <div className="mt-4">
 <RendersGallery
 urls={statusPayload.outputUrls}
 angleLabel={
 ANGLE_LABELS[
 statusPayload.renderAngle as RenderAngle
 ] ?? statusPayload.renderAngle
 }
 styleLabel={
 STYLE_LABELS[
 statusPayload.renderStyle as RenderStyle
 ] ?? statusPayload.renderStyle
 }
 onExpand={(i) => {
 setModalIndex(i);
 setModalOpen(true);
 }}
 onDownloadOne={(url, i) => {
 void downloadUrl(url, `render-${i + 1}.jpg`).catch(() =>
 setToast({
 message: "Download failed.",
 variant: "error",
 }),
 );
 }}
 />
 </div>

 <div className="mt-6 flex flex-wrap gap-2 border-t border-border/55 pt-4">
 <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
 {statusPayload.packageShape}
 </span>
 <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
 {STYLE_LABELS[statusPayload.renderStyle as RenderStyle] ??
 statusPayload.renderStyle}
 </span>
 <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
 {ANGLE_LABELS[statusPayload.renderAngle as RenderAngle] ??
 statusPayload.renderAngle}
 </span>
 <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
 Engine: {engineLabel}
 </span>
 <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
 Generated in {timeBadge}
 </span>
 </div>

 <div className="mt-6 flex flex-wrap gap-3">
 <button
 type="button"
 onClick={() =>
 void downloadAllZip(statusPayload.outputUrls).catch(() =>
 setToast({
 message: "Could not build ZIP.",
 variant: "error",
 }),
 )
 }
 className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
 >
 Download All
 </button>
 <button
 type="button"
 onClick={() => {
 setRegenStyle(statusPayload.renderStyle as RenderStyle);
 setRegenAngle(statusPayload.renderAngle as RenderAngle);
 setShowRegeneratePanel((v) => !v);
 }}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
 >
 Try Different Style
 </button>
 <button
 type="button"
 onClick={resetAll}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
 >
 Render New Packaging
 </button>
 <button
 type="button"
 onClick={() =>
 setToast({
 message: "Saved to gallery.",
 variant: "success",
 })
 }
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
 >
 Save to Gallery
 </button>
 </div>

 {showRegeneratePanel ? (
 <div className="mt-6 rounded-xl border border-border bg-muted/80 p-4">
 <StyleSelector value={regenStyle} onChange={setRegenStyle} />
 <div className="mt-4">
 <AngleSelector value={regenAngle} onChange={setRegenAngle} />
 </div>
 <button
 type="button"
 disabled={busy}
 onClick={() => void confirmRegenerate()}
 className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60"
 >
 Regenerate with these settings
 </button>
 </div>
 ) : null}
 </section>

 <PromptAccordion
 promptUsed={statusPayload.promptUsed}
 renderEngine={statusPayload.renderEngine}
 />

 <HistoryStrip
 items={
 historyData?.items?.map((h) => ({
 _id: h._id,
 outputUrls: h.outputUrls,
 packageShape: h.packageShape,
 })) ?? []
 }
 onSelect={(id) => void loadHistoryJob(id)}
 />
 </div>
 ) : null}
 </div>
 </FeaturePage>

 <FullscreenModal
 open={modalOpen}
 urls={statusPayload?.outputUrls ?? []}
 index={modalIndex}
 onClose={() => setModalOpen(false)}
 onPrev={() =>
 setModalIndex((i) => {
 const len = statusPayload?.outputUrls?.length ?? 1;
 return (i - 1 + len) % len;
 })
 }
 onNext={() =>
 setModalIndex((i) => {
 const len = statusPayload?.outputUrls?.length ?? 1;
 return (i + 1) % len;
 })
 }
 onDownload={(url) => {
 void downloadUrl(url, "render.jpg").catch(() =>
 setToast({ message: "Download failed.", variant: "error" }),
 );
 }}
 />

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
