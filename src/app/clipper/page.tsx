"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { VideoInput } from "./components/VideoInput";
import { ProcessingView } from "./components/ProcessingView";
import { ClipsTab } from "./components/ClipsTab";
import { BlogTab, type BlogPostPayload } from "./components/BlogTab";
import { HistoryStrip, type HistoryItem } from "./components/HistoryStrip";
import type { IdentifiedClipRow } from "./components/ClipCard";
import { formatSeconds } from "@/lib/videoChopper/timeUtils";

type View = "input" | "processing" | "result";

type JobPayload = {
 _id: string;
 youtubeUrl: string;
 videoId: string;
 videoTitle?: string;
 videoDuration?: number;
 channelName?: string;
 thumbnailUrl?: string;
 status: string;
 currentStep?: number;
 completedClips?: number;
 totalClips?: number;
 errorMessage?: string | null;
 includeBlogPost?: boolean;
 identifiedClips?: IdentifiedClipRow[];
 blogPost?: BlogPostPayload | null;
 processingTimeMs?: number | null;
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

export default function ClipperPage() {
 const [view, setView] = useState<View>("input");
 const [jobId, setJobId] = useState<string | null>(null);
 const [job, setJob] = useState<JobPayload | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [tab, setTab] = useState<"clips" | "blog">("clips");
 const [elapsedSec, setElapsedSec] = useState(0);
 const [pollStopped, setPollStopped] = useState(false);
 const [historyBusy, setHistoryBusy] = useState<string | null>(null);
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error" | "info";
 } | null>(null);

 const pollStartRef = useRef<number | null>(null);
 const timerRef = useRef<number | null>(null);

 const {
 data: historyData,
 mutate: mutateHistory,
 } = useSWR<{ items: HistoryItem[] }>("/api/video-chopper/history", fetchJson, {
 revalidateOnFocus: true,
 });

 const resetAll = useCallback(() => {
 setView("input");
 setJobId(null);
 setJob(null);
 setTab("clips");
 setElapsedSec(0);
 setPollStopped(false);
 pollStartRef.current = null;
 if (timerRef.current) {
 window.clearInterval(timerRef.current);
 timerRef.current = null;
 }
 }, []);

 const onTryAgain = useCallback(() => {
 resetAll();
 }, [resetAll]);

 useEffect(() => {
 if (view !== "processing" || !jobId) {
 if (timerRef.current) {
 window.clearInterval(timerRef.current);
 timerRef.current = null;
 }
 return;
 }
 setElapsedSec(0);
 timerRef.current = window.setInterval(() => {
 setElapsedSec((s) => s + 1);
 }, 1000);
 return () => {
 if (timerRef.current) {
 window.clearInterval(timerRef.current);
 timerRef.current = null;
 }
 };
 }, [view, jobId]);

 useEffect(() => {
 if (view !== "processing" || !jobId || pollStopped) {
 return;
 }
 if (pollStartRef.current === null) {
 pollStartRef.current = Date.now();
 }

 let cancelled = false;

 async function poll() {
 if (!jobId) {
 return;
 }
 const started = pollStartRef.current ?? Date.now();
 if (Date.now() - started > 15 * 60 * 1000) {
 setPollStopped(true);
 setToast({
 message: "Stopped polling after 15 minutes. Refresh or open history if the job finished.",
 variant: "info",
 });
 return;
 }
 try {
 const data = await fetchJson<JobPayload>(`/api/video-chopper/status/${jobId}`);
 if (cancelled) {
 return;
 }
 setJob(data);
 if (data.status === "complete") {
 setView("result");
 void mutateHistory();
 }
 if (data.status === "failed") {
 /* ProcessingView shows error */
 }
 } catch {
 if (!cancelled) {
 setToast({ message: "Could not load job status.", variant: "error" });
 }
 }
 }

 void poll();
 const id = window.setInterval(poll, 3000);
 return () => {
 cancelled = true;
 window.clearInterval(id);
 };
 }, [view, jobId, pollStopped, mutateHistory]);

 const onSubmitJob = useCallback(
 async (payload: {
 youtubeUrl: string;
 numberOfClips: number;
 includeBlogPost: boolean;
 }) => {
 setSubmitting(true);
 try {
 const res = await fetchJson<{ jobId: string }>("/api/video-chopper/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });
 pollStartRef.current = Date.now();
 setPollStopped(false);
 setJobId(res.jobId);
 setJob(null);
 setView("processing");
 setToast({ message: "Started processing your video.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not start job.",
 variant: "error",
 });
 } finally {
 setSubmitting(false);
 }
 },
 [],
 );

 const loadHistoryJob = useCallback(
 async (id: string) => {
 setHistoryBusy(id);
 try {
 const data = await fetchJson<JobPayload>(`/api/video-chopper/status/${id}`);
 setJobId(id);
 setJob(data);
 setView("result");
 setTab(data.blogPost ? "clips" : "clips");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not load job.",
 variant: "error",
 });
 } finally {
 setHistoryBusy(null);
 }
 },
 [],
 );

 const deleteJob = useCallback(async () => {
 if (!jobId) {
 return;
 }
 try {
 await fetchJson(`/api/video-chopper/history/${jobId}`, { method: "DELETE" });
 await mutateHistory();
 setToast({ message: "Job deleted.", variant: "success" });
 resetAll();
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Delete failed.",
 variant: "error",
 });
 }
 }, [jobId, mutateHistory, resetAll]);

 const pollWarn = true;
 const stillProcessingHint = elapsedSec >= 600;

 const displayJob = job;
 const clips = displayJob?.identifiedClips ?? [];

 const showBlogSpinner = useMemo(() => {
 if (!displayJob?.includeBlogPost) {
 return false;
 }
 return displayJob.status === "blogging" && !displayJob.blogPost;
 }, [displayJob]);

 return (
 <>
 <FeaturePage
 title={
 <span className="flex flex-wrap items-center gap-3">
 Viral Video Chopper
 <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-900">
 Up to 8 viral clips
 </span>
 <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
 SEO blog post included
 </span>
 </span>
 }
 description="Turn any YouTube video into viral short clips and a full SEO blog post."
 >
 <div className="mt-8 max-w-4xl space-y-8">
 {view === "input" && (
 <VideoInput onSubmit={onSubmitJob} busy={submitting} />
 )}

 {view === "processing" && jobId && (
 <ProcessingView
 thumbnailUrl={job?.thumbnailUrl ?? null}
 title={job?.videoTitle ?? ""}
 status={job?.status ?? "queued"}
 currentStep={job?.currentStep ?? 0}
 completedClips={job?.completedClips ?? 0}
 totalClips={job?.totalClips ?? 0}
 errorMessage={job?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 pollWarn={pollWarn}
 stillProcessingHint={stillProcessingHint}
 onTryAgain={onTryAgain}
 />
 )}

 {view === "result" && displayJob && (
 <>
 <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
 <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/55 bg-foreground/10">
 {displayJob.thumbnailUrl ? (
 <Image
 src={displayJob.thumbnailUrl}
 alt=""
 fill
 className="object-cover"
 sizes="48px"
 unoptimized
 />
 ) : null}
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-heading font-semibold text-foreground">
 {displayJob.videoTitle}
 </p>
 <p className="text-sm text-muted-foreground">{displayJob.channelName}</p>
 <p className="text-xs text-muted-foreground">
 {formatSeconds(displayJob.videoDuration ?? 0)}
 </p>
 </div>
 <a
 href={displayJob.youtubeUrl}
 target="_blank"
 rel="noreferrer"
 className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
 >
 View on YouTube
 </a>
 </div>

 <div className="flex gap-2 border-b border-border pb-2">
 <button
 type="button"
 onClick={() => setTab("clips")}
 className={
 tab === "clips"
 ? "rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
 : "rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-foreground/10"
 }
 >
 Viral Clips ({clips.length})
 </button>
 <button
 type="button"
 onClick={() => setTab("blog")}
 className={
 tab === "blog"
 ? "rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
 : "rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-foreground/10"
 }
 >
 Blog Post
 </button>
 </div>

 {tab === "clips" ? (
 <ClipsTab
 clips={clips}
 videoId={displayJob.videoId}
 videoDuration={displayJob.videoDuration ?? 0}
 onToast={(m, v) => setToast({ message: m, variant: v })}
 />
 ) : (
 <BlogTab
 blog={displayJob.blogPost ?? null}
 loadingBlog={Boolean(showBlogSpinner)}
 onToast={(m, v) => setToast({ message: m, variant: v })}
 />
 )}

 <div className="flex flex-wrap gap-3">
 <button
 type="button"
 onClick={resetAll}
 className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
 >
 Process Another Video
 </button>
 <button
 type="button"
 onClick={() => void deleteJob()}
 className="rounded-lg border border-red-200 bg-card px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
 >
 Delete This Job
 </button>
 </div>

 <HistoryStrip
 items={historyData?.items ?? []}
 onSelect={(id) => void loadHistoryJob(id)}
 busyId={historyBusy}
 />
 </>
 )}
 </div>
 </FeaturePage>

 {toast ? (
 <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
 ) : null}
 </>
 );
}
