"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { URLInput, useDebouncedAmazonProductUrlValid } from "./components/URLInput";
import { ProcessingView } from "./components/ProcessingView";
import { CritiqueVideoTab } from "./components/CritiqueVideoTab";
import { ListingScoreTab } from "./components/ListingScoreTab";
import { RewritesTab } from "./components/RewritesTab";
import { ScriptSections } from "./components/ScriptSections";
import { ShareRow } from "./components/ShareRow";
import { HistoryStrip } from "./components/HistoryStrip";
import { HistoryView } from "./components/HistoryView";
import { normalizeRoasterJob } from "./components/formatRoasterJob";
import type { HistoryStripItem, RoasterJobView } from "./components/types";
import { extractAsin } from "@/lib/roaster/extractAsin";

type View = "input" | "processing" | "result" | "history";

const STORAGE_KEY = "pixii-roaster-last-job";

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

function tabBtn(active: boolean): string {
 return (
 "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
 (active
 ? "bg-primary/10 text-primary"
 : "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground")
 );
}

export default function RoasterDashboardPage() {
 const [view, setView] = useState<View>("input");
 const [urlInput, setUrlInput] = useState("");
 const [pendingAsin, setPendingAsin] = useState("");
 const [jobId, setJobId] = useState<string | null>(null);
 const [job, setJob] = useState<RoasterJobView | null>(null);
 const [resultTab, setResultTab] = useState<"video" | "score" | "rewrites">(
 "video",
 );
 const [elapsedSec, setElapsedSec] = useState(0);
 const [busyHistoryId, setBusyHistoryId] = useState<string | null>(null);
 const [resumeDismissed, setResumeDismissed] = useState(false);
 const [resumeOffer, setResumeOffer] = useState<{
 jobId: string;
 title: string;
 } | null>(null);
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error";
 } | null>(null);

 const pollTimerRef = useRef<number | null>(null);
 const elapsedTimerRef = useRef<number | null>(null);
 const urlValid = useDebouncedAmazonProductUrlValid(urlInput);

 const { data: historyData, mutate: mutateHistory } = useSWR<{
 items: {
 _id: string;
 title: string;
 brand: string;
 imageUrls: string[];
 overallScore: number;
 letterGrade: string;
 createdAt: string;
 }[];
 }>("/api/roaster/history", fetchJson, { revalidateOnFocus: true });

 const historyStripItems: HistoryStripItem[] = (historyData?.items ?? []).map(
 (h) => ({
 _id: h._id,
 title: h.title,
 brand: h.brand,
 thumbUrl: h.imageUrls?.[0] ?? "",
 overallScore: h.overallScore,
 letterGrade: h.letterGrade,
 createdAt: h.createdAt,
 }),
 );

 const resetToInput = useCallback(() => {
 setView("input");
 setJobId(null);
 setJob(null);
 setPendingAsin("");
 setElapsedSec(0);
 setResultTab("video");
 }, []);

 const loadJob = useCallback(async (id: string) => {
 const raw = await fetchJson<Record<string, unknown>>(
 `/api/roaster/status/${id}`,
 );
 setJob(normalizeRoasterJob(raw));
 }, []);

 useEffect(() => {
 if (typeof window === "undefined") {
 return;
 }
 const id = localStorage.getItem(STORAGE_KEY);
 if (!id || resumeDismissed) {
 return;
 }
 let cancelled = false;
 void fetchJson<Record<string, unknown>>(`/api/roaster/status/${id}`)
 .then((doc) => {
 if (cancelled || doc.status !== "complete") {
 return;
 }
 const j = normalizeRoasterJob(doc);
 const t = j.listingData.title;
 if (t) {
 setResumeOffer({ jobId: id, title: t });
 }
 })
 .catch(() => {});
 return () => {
 cancelled = true;
 };
 }, [resumeDismissed]);

 useEffect(() => {
 if (view !== "processing" || !jobId) {
 if (elapsedTimerRef.current) {
 window.clearInterval(elapsedTimerRef.current);
 elapsedTimerRef.current = null;
 }
 return;
 }
 setElapsedSec(0);
 elapsedTimerRef.current = window.setInterval(() => {
 setElapsedSec((s) => s + 1);
 }, 1000);
 return () => {
 if (elapsedTimerRef.current) {
 window.clearInterval(elapsedTimerRef.current);
 elapsedTimerRef.current = null;
 }
 };
 }, [view, jobId]);

 useEffect(() => {
 if (view !== "processing" || !jobId) {
 if (pollTimerRef.current) {
 window.clearInterval(pollTimerRef.current);
 pollTimerRef.current = null;
 }
 return;
 }
 let cancelled = false;

 async function poll() {
 try {
 const raw = await fetchJson<Record<string, unknown>>(
 `/api/roaster/status/${jobId}`,
 );
 if (cancelled) {
 return;
 }
 const j = normalizeRoasterJob(raw);
 setJob(j);
 if (j.status === "complete") {
 if (typeof window !== "undefined" && jobId) {
 localStorage.setItem(STORAGE_KEY, jobId);
 }
 setView("result");
 void mutateHistory();
 }
 if (j.status === "failed") {
 setJob(j);
 }
 } catch {
 if (!cancelled) {
 setToast({ message: "Could not load job status.", variant: "error" });
 }
 }
 }

 void poll();
 pollTimerRef.current = window.setInterval(() => void poll(), 3000);
 return () => {
 cancelled = true;
 if (pollTimerRef.current) {
 window.clearInterval(pollTimerRef.current);
 pollTimerRef.current = null;
 }
 };
 }, [view, jobId, mutateHistory]);

 const onRoast = useCallback(async () => {
 const url = urlInput.trim();
 if (!urlValid) {
 return;
 }
 setToast(null);
 const asin = extractAsin(url) ?? "";
 setPendingAsin(asin);
 try {
 const res = await fetchJson<{ jobId: string }>("/api/roaster/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ amazonUrl: url }),
 });
 setJobId(res.jobId);
 setJob(null);
 setView("processing");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not start roast.",
 variant: "error",
 });
 }
 }, [urlInput, urlValid]);

 const onOpenHistoryItem = useCallback(
 async (id: string) => {
 setBusyHistoryId(id);
 try {
 await loadJob(id);
 setJobId(id);
 setView("result");
 setResultTab("video");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not load roast.",
 variant: "error",
 });
 } finally {
 setBusyHistoryId(null);
 }
 },
 [loadJob],
 );

 const onDeleteHistory = useCallback(
 async (id: string) => {
 try {
 await fetchJson(`/api/roaster/history/${id}`, { method: "DELETE" });
 await mutateHistory();
 if (jobId === id) {
 resetToInput();
 }
 setToast({ message: "Removed from history.", variant: "success" });
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Delete failed.",
 variant: "error",
 });
 }
 },
 [mutateHistory, jobId, resetToInput],
 );

 const asinChip =
 job?.asin?.trim() ||
 pendingAsin ||
 (urlInput.trim() ? extractAsin(urlInput.trim()) ?? "" : "");

 return (
 <>
 <FeaturePage
 title={
 <span className="flex flex-wrap items-center gap-3">
 Roaster
 {view !== "processing" ? (
 <button
 type="button"
 onClick={() => setView("history")}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-sm hover:bg-muted"
 >
 History
 </button>
 ) : null}
 </span>
 }
 description="Paste your Amazon listing URL. Get a direct, no-fluff video critique with a prioritized fix list in minutes."
 >
 <div className="mt-6 max-w-6xl space-y-6">
 {view === "input" && (
 <>
 <div className="flex flex-wrap gap-2">
 <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
 60-90 sec video critique
 </span>
 <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
 Listing score + grade
 </span>
 <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
 Suggested rewrites
 </span>
 </div>

 {resumeOffer && !resumeDismissed ? (
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm">
 <p className="font-medium text-foreground">
 Resume last roast:{" "}
 <span className="font-semibold text-primary">
 {resumeOffer.title.length > 48
 ? `${resumeOffer.title.slice(0, 48)}…`
 : resumeOffer.title}
 </span>
 </p>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => void onOpenHistoryItem(resumeOffer.jobId)}
 className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
 >
 View Results
 </button>
 <button
 type="button"
 onClick={() => setResumeDismissed(true)}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-sm hover:bg-muted"
 >
 Dismiss
 </button>
 </div>
 </div>
 ) : null}

 <URLInput value={urlInput} onChange={setUrlInput} />

 <div className="grid gap-4 md:grid-cols-3">
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="font-heading text-sm font-semibold text-foreground">
 Listing Grade
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 Overall score A–F with subscores for every listing element
 </p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="font-heading text-sm font-semibold text-foreground">
 Video Critique
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 60-90 second direct video with no filler and no false
 encouragement
 </p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
 <p className="font-heading text-sm font-semibold text-foreground">
 Rewrites Included
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 Claude rewrites your title, bullets, and description opening —
 ready to copy
 </p>
 </div>
 </div>

 <p className="text-center text-xs text-muted-foreground">
 ~3-5 minutes · 60-90 sec video · Rewrites for every weak
 element
 </p>

 <button
 type="button"
 disabled={!urlValid}
 onClick={() => void onRoast()}
 className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Roast My Listing →
 </button>

 <HistoryStrip
 items={historyStripItems}
 onSelect={(id) => void onOpenHistoryItem(id)}
 busyId={busyHistoryId}
 />
 </>
 )}

 {view === "processing" && (
 <ProcessingView
 asinChip={asinChip || "…"}
 status={job?.status ?? "queued"}
 currentStep={job?.currentStep ?? 1}
 errorMessage={job?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 onTryAgain={resetToInput}
 />
 )}

 {view === "result" && job && job.status === "complete" ? (
 <>
 <div className="flex flex-wrap items-start gap-2">
 <h2 className="min-w-0 flex-1 font-heading text-lg font-semibold text-foreground">
 {(job.listingData.title || "Listing").length > 60
 ? `${(job.listingData.title || "").slice(0, 60)}…`
 : job.listingData.title || "Listing"}
 </h2>
 {job.asin ? (
 <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
 ASIN: {job.asin}
 </span>
 ) : null}
 </div>
 {job.listingData.brand ? (
 <p className="text-sm text-muted-foreground">{job.listingData.brand}</p>
 ) : null}

 <div className="flex flex-wrap gap-2 border-b border-border pb-2">
 <button
 type="button"
 className={tabBtn(resultTab === "video")}
 onClick={() => setResultTab("video")}
 >
 Critique Video
 </button>
 <button
 type="button"
 className={tabBtn(resultTab === "score")}
 onClick={() => setResultTab("score")}
 >
 Listing Score
 </button>
 <button
 type="button"
 className={tabBtn(resultTab === "rewrites")}
 onClick={() => setResultTab("rewrites")}
 >
 Rewrites
 </button>
 </div>

 {resultTab === "video" ? <CritiqueVideoTab job={job} /> : null}
 {resultTab === "score" ? <ListingScoreTab job={job} /> : null}
 {resultTab === "rewrites" ? <RewritesTab job={job} /> : null}

 <ScriptSections job={job} />
 <ShareRow job={job} />

 <button
 type="button"
 onClick={resetToInput}
 className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
 >
 ← Roast Another Listing
 </button>

 <HistoryStrip
 items={historyStripItems}
 onSelect={(id) => void onOpenHistoryItem(id)}
 busyId={busyHistoryId}
 />
 </>
 ) : null}

 {view === "history" ? (
 <>
 <button
 type="button"
 onClick={() => setView("input")}
 className="text-sm font-semibold text-muted-foreground hover:text-foreground"
 >
 ← Back to roast
 </button>
 <HistoryView
 items={historyStripItems}
 onView={(id) => void onOpenHistoryItem(id)}
 onDelete={(id) => void onDeleteHistory(id)}
 busyId={busyHistoryId}
 />
 </>
 ) : null}
 </div>
 </FeaturePage>

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
