"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import { PERSONA_ROAST_ICONS } from "@/components/icons/PersonaRoastIcons";
import type { InfluencerPersonaId } from "@/lib/aiCreator/personas";
import { PERSONAS } from "@/lib/aiCreator/personas";
import type {
 ListingAnalysis,
 RoastScript,
} from "@/lib/aiCreator/types";
import { URLInput } from "@/app/dashboard/ai-creator/components/URLInput";
import { PersonaGrid } from "@/app/dashboard/ai-creator/components/PersonaGrid";
import { ProcessingView } from "@/app/dashboard/ai-creator/components/ProcessingView";
import { VideoTab } from "@/app/dashboard/ai-creator/components/VideoTab";
import { ScoreTab } from "@/app/dashboard/ai-creator/components/ScoreTab";
import { ScriptTab } from "@/app/dashboard/ai-creator/components/ScriptTab";
import { ShareRow } from "@/app/dashboard/ai-creator/components/ShareRow";
import {
 HistoryStrip,
 type HistoryStripItem,
} from "@/app/dashboard/ai-creator/components/HistoryStrip";

type View = "input" | "processing" | "result" | "history";

type JobPayload = {
 _id: string;
 status: string;
 currentStep: number;
 asin?: string;
 amazonUrl?: string;
 influencerPersona?: InfluencerPersonaId;
 listingData?: { title?: string; brand?: string };
 listingAnalysis?: ListingAnalysis;
 roastScript?: RoastScript;
 voiceoverUrl?: string;
 avatarFrameUrls?: string[];
 finalVideoUrl?: string;
 shareableLink?: string;
 captionsText?: string;
 errorMessage?: string;
};

const PERSONA_STORAGE = "pixii-ai-creator-persona";

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

export default function AiCreatorPage() {
 const [view, setView] = useState<View>("input");
 const [url, setUrl] = useState("");
 const [persona, setPersona] = useState<InfluencerPersonaId>("savage_sarah");
 const [jobId, setJobId] = useState<string | null>(null);
 const [job, setJob] = useState<JobPayload | null>(null);
 const [resultTab, setResultTab] = useState<"video" | "score" | "script">(
 "video",
 );
 const [elapsedSec, setElapsedSec] = useState(0);
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error" | "info";
 } | null>(null);

 useEffect(() => {
 try {
 const s = localStorage.getItem(PERSONA_STORAGE);
 if (
 s &&
 [
 "savage_sarah",
 "brutally_honest_brad",
 "marketing_maven_mia",
 "conversion_king_carlos",
 "trendy_tiffany",
 "data_driven_david",
 ].includes(s)
 ) {
 setPersona(s as InfluencerPersonaId);
 }
 } catch {
 /* ignore */
 }
 }, []);

 useEffect(() => {
 try {
 localStorage.setItem(PERSONA_STORAGE, persona);
 } catch {
 /* ignore */
 }
 }, [persona]);

 const { data: historyData, mutate: mutateHistory } = useSWR<{
 items: {
 _id: string;
 title: string;
 overallScore: number;
 avatarFrameUrls: string[];
 finalVideoUrl: string;
 }[];
 }>("/api/ai-creator/history", fetchJson, { revalidateOnFocus: true });

 const historyStripItems: HistoryStripItem[] = useMemo(() => {
 return (historyData?.items ?? []).map((h) => ({
 _id: h._id,
 title: h.title,
 overallScore: h.overallScore,
 thumbUrl: h.avatarFrameUrls?.[0] ?? "",
 }));
 }, [historyData]);

 const pollUrl = jobId ? `/api/ai-creator/status/${jobId}` : null;

 useEffect(() => {
 if (!pollUrl || view !== "processing") {
 return;
 }
 let cancelled = false;

 const url = pollUrl;

 async function poll() {
 try {
 const data = await fetchJson<JobPayload>(url);
 if (cancelled) {
 return;
 }
 setJob(data);
 if (data.status === "complete") {
 setView("result");
 void mutateHistory();
 }
 if (data.status === "failed") {
 setToast({
 message: data.errorMessage ?? "Processing failed.",
 variant: "error",
 });
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
 const id = window.setInterval(poll, 3000);
 return () => {
 cancelled = true;
 window.clearInterval(id);
 };
 }, [pollUrl, view, mutateHistory]);

 useEffect(() => {
 if (view !== "processing") {
 setElapsedSec(0);
 return;
 }
 const id = window.setInterval(() => {
 setElapsedSec((s) => s + 1);
 }, 1000);
 return () => window.clearInterval(id);
 }, [view]);

 const canSubmit = useMemo(() => {
 const u = url.trim().toLowerCase();
 if (!u.includes("amazon.") && !u.includes("amzn.")) {
 return false;
 }
 return Boolean(extractAsin(url));
 }, [url]);

 const resetInput = useCallback(() => {
 setJobId(null);
 setJob(null);
 setView("input");
 setResultTab("video");
 }, []);

 const loadJobForResult = useCallback(async (id: string) => {
 setJobId(id);
 const data = await fetchJson<JobPayload>(
 `/api/ai-creator/status/${id}`,
 );
 setJob(data);
 if (data.status === "complete") {
 setView("result");
 } else if (data.status === "failed") {
 setToast({
 message: data.errorMessage ?? "Job failed.",
 variant: "error",
 });
 setView("input");
 } else {
 setView("processing");
 }
 }, []);

 const refreshJob = useCallback(async () => {
 if (!jobId) {
 return;
 }
 const data = await fetchJson<JobPayload>(
 `/api/ai-creator/status/${jobId}`,
 );
 setJob(data);
 }, [jobId]);

 const onSubmit = async () => {
 try {
 const res = await fetchJson<{ jobId: string }>(
 "/api/ai-creator/submit",
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ amazonUrl: url, influencerPersona: persona }),
 },
 );
 setJobId(res.jobId);
 setJob(null);
 setView("processing");
 setElapsedSec(0);
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Submit failed.",
 variant: "error",
 });
 }
 };

 const personaId =
 (job?.influencerPersona as InfluencerPersonaId) ?? persona;
 const PersonaResultIcon = PERSONA_ROAST_ICONS[personaId];

 return (
 <FeaturePage
 title="AI Creator"
 description="Drop in your Amazon listing URL and get a brutal influencer critique video in minutes."
 >
 <div className="mt-6 flex flex-wrap gap-2">
 <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
 60-sec critique video
 </span>
 <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-900">
 6 AI personas
 </span>
 <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
 Listing score included
 </span>
 </div>

 <div className="mt-6 flex flex-wrap gap-2 border-b border-border/55 pb-4">
 <button
 type="button"
 className={tabBtn(view === "input")}
 onClick={() => setView("input")}
 >
 New roast
 </button>
 <button
 type="button"
 className={tabBtn(view === "history")}
 onClick={() => setView("history")}
 >
 History
 </button>
 </div>

 {view === "input" ? (
 <div className="mt-8 max-w-3xl space-y-8">
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <URLInput value={url} onChange={setUrl} />
 </section>

 <section>
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Choose your roaster
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Each persona has a different critique style and delivery
 </p>
 <div className="mt-4">
 <PersonaGrid selected={persona} onSelect={setPersona} />
 </div>
 </section>

 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h3 className="font-heading text-base font-semibold text-foreground">
 What you&apos;ll get
 </h3>
 <div className="mt-4 grid gap-4 md:grid-cols-3">
 <div>
 <p className="text-sm font-semibold text-foreground">
 Listing scorecard
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 Title, bullets, images, and description scored 0–100
 </p>
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground">
 Critique video
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 ~60-second roast from your chosen influencer persona
 </p>
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground">
 Fix list
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 Actionable improvements for every weakness found
 </p>
 </div>
 </div>
 <p className="mt-6 text-xs text-muted-foreground">
 ~4–6 minutes · ~60-sec video · ~$0.12 per roast (estimate)
 </p>
 <button
 type="button"
 disabled={!canSubmit}
 onClick={() => void onSubmit()}
 className="mt-6 flex h-[52px] w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
 >
 Generate roast video →
 </button>
 </section>
 </div>
 ) : null}

 {view === "history" ? (
 <div className="mt-8 max-w-4xl">
 <p className="text-sm text-muted-foreground">
 Select a past roast to open results.
 </p>
 <ul className="mt-4 space-y-2">
 {(historyData?.items ?? []).map((h) => (
 <li key={h._id}>
 <button
 type="button"
 onClick={() => void loadJobForResult(h._id)}
 className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm hover:border-primary/25"
 >
 <span className="line-clamp-1 text-sm font-semibold text-foreground">
 {h.title || "Listing"}
 </span>
 <span className="ml-3 shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-bold">
 {h.overallScore}/100
 </span>
 </button>
 </li>
 ))}
 </ul>
 {(historyData?.items ?? []).length === 0 ? (
 <p className="mt-4 text-sm text-muted-foreground">No roasts yet.</p>
 ) : null}
 </div>
 ) : null}

 {view === "processing" && jobId ? (
 <div className="mt-8 max-w-lg">
 <ProcessingView
 asin={job?.asin ?? extractAsin(url) ?? ""}
 personaId={persona}
 status={job?.status ?? "queued"}
 currentStep={job?.currentStep ?? 0}
 errorMessage={job?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 onTryAgain={resetInput}
 />
 </div>
 ) : null}

 {view === "result" && job && job.status === "complete" ? (
 <div className="mt-8 max-w-3xl space-y-8">
 <div className="flex flex-wrap items-center gap-2 border-b border-border/55 pb-4">
 <p className="font-heading text-lg font-semibold text-foreground">
 {job.listingData?.title ?? "Your listing"}
 </p>
 <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground/90">
 {job.asin}
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground/90">
 <PersonaResultIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
 {PERSONAS[personaId].name}{" "}
 <span className="text-muted-foreground">
 {PERSONAS[personaId].handle}
 </span>
 </span>
 </div>

 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 className={tabBtn(resultTab === "video")}
 onClick={() => setResultTab("video")}
 >
 Roast video
 </button>
 <button
 type="button"
 className={tabBtn(resultTab === "score")}
 onClick={() => setResultTab("score")}
 >
 Listing score
 </button>
 <button
 type="button"
 className={tabBtn(resultTab === "script")}
 onClick={() => setResultTab("script")}
 >
 Script & fix list
 </button>
 </div>

 {resultTab === "video" ? (
 <VideoTab
 personaId={personaId}
 finalVideoUrl={job.finalVideoUrl ?? ""}
 avatarFrameUrls={job.avatarFrameUrls ?? []}
 voiceoverUrl={job.voiceoverUrl ?? ""}
 roastScript={job.roastScript}
 shareableLink={job.shareableLink ?? ""}
 />
 ) : null}
 {resultTab === "score" ? (
 <ScoreTab analysis={job.listingAnalysis} />
 ) : null}
 {resultTab === "script" && jobId ? (
 <ScriptTab
 jobId={jobId}
 roastScript={job.roastScript}
 listingAnalysis={job.listingAnalysis}
 onJobRefresh={refreshJob}
 onToast={(m, v) => setToast({ message: m, variant: v })}
 />
 ) : null}

 <ShareRow
 shareableLink={job.shareableLink ?? ""}
 overallScore={job.listingAnalysis?.overallScore ?? 0}
 weaknesses={job.listingAnalysis?.weaknesses ?? []}
 onToast={(m, v) => setToast({ message: m, variant: v })}
 />

 <HistoryStrip
 items={historyStripItems}
 onSelect={(id) => void loadJobForResult(id)}
 />

 <button
 type="button"
 onClick={resetInput}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
 >
 Start another roast
 </button>
 </div>
 ) : null}

 {toast ? (
 <Toast
 message={toast.message}
 variant={toast.variant}
 onDismiss={() => setToast(null)}
 />
 ) : null}
 </FeaturePage>
 );
}
