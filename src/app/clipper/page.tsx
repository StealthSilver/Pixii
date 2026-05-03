"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { BetaFeatureNotice } from "@/components/BetaFeatureNotice";
import { GridBackdrop } from "@/components/GridBackdrop";
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

const secondaryBtn =
 "rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

const primaryBtn =
 "rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

const destructiveOutlineBtn =
 "rounded-lg border border-red-200/90 bg-card px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200/50 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/35 dark:border-red-500/35 dark:text-red-300 dark:ring-red-500/20 dark:hover:bg-red-950/35";

function segmentTabClass(active: boolean): string {
 return (
 "rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
 (active
 ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
 : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
 );
}

export default function ClipperPage() {
 const [mainTab, setMainTab] = useState<"chop" | "history">("chop");
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
 setMainTab("chop");
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

 const processingLocked = view === "processing";

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
 Viral Video Chopper
 </h1>
 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
 Turn any YouTube video into short clips and an optional SEO blog post—minimal
 layout, same shell as the rest of Pixii.
 </p>
 <div className="mt-4 flex flex-wrap gap-2">
 <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
 Up to 8 clips
 </span>
 <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
 SEO blog optional
 </span>
 </div>
 </header>

 <div
 className="mt-8 inline-flex rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
 role="tablist"
 aria-label="Clipper sections"
 >
 <button
 type="button"
 role="tab"
 aria-selected={mainTab === "chop"}
 className={segmentTabClass(mainTab === "chop")}
 onClick={() => setMainTab("chop")}
 >
 Chop
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

 <div className="mt-8 max-w-6xl space-y-8">
 {mainTab === "history" ? (
 <>
 {(historyData?.items ?? []).length === 0 ? (
 <p className="text-sm text-muted-foreground">
 No jobs yet. Paste a YouTube link from the Chop tab.
 </p>
 ) : (
 <>
 <p className="text-sm text-muted-foreground">
 Open a past chop to review clips or the blog post.
 </p>
 <ul className="space-y-2">
 {(historyData?.items ?? []).map((h) => (
 <li key={h._id}>
 <button
 type="button"
 disabled={historyBusy === h._id}
 onClick={() => void loadHistoryJob(h._id)}
 className="flex w-full items-center gap-3 rounded-xl border border-border/80 bg-card/95 px-4 py-3 text-left shadow-sm ring-1 ring-black/[0.03] transition-colors hover:border-primary/25 disabled:opacity-60 dark:ring-white/[0.05]"
 >
 <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
 {h.thumbnailUrl ? (
 <Image
 src={h.thumbnailUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 ) : null}
 </div>
 <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
 {h.videoTitle || "Video"}
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
 <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 ring-1 ring-black/[0.04] dark:bg-muted/30 dark:ring-white/[0.06]">
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
 className={secondaryBtn + " shrink-0 px-3 py-2 text-sm"}
 >
 View on YouTube
 </a>
 </div>

 <div
 className="flex gap-1 border-b border-border/70 pb-2"
 role="tablist"
 aria-label="Result sections"
 >
 <button
 type="button"
 role="tab"
 aria-selected={tab === "clips"}
 onClick={() => setTab("clips")}
 className={segmentTabClass(tab === "clips")}
 >
 Viral Clips ({clips.length})
 </button>
 <button
 type="button"
 role="tab"
 aria-selected={tab === "blog"}
 onClick={() => setTab("blog")}
 className={segmentTabClass(tab === "blog")}
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
 <button type="button" onClick={resetAll} className={primaryBtn}>
 Process Another Video
 </button>
 <button
 type="button"
 onClick={() => void deleteJob()}
 className={destructiveOutlineBtn}
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
 </>
 )}
 </div>
 </div>
 </div>

 {toast ? (
 <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
 ) : null}
 </>
 );
}
