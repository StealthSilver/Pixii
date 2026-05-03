"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { GridBackdrop } from "@/components/GridBackdrop";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { extractCategoryFromUrl } from "@/lib/marketEstimator/amazonUrl";
import { URLInput, useDebouncedUrlValid } from "./components/URLInput";
import { ProcessingView } from "./components/ProcessingView";
import { MarketOverviewTab } from "./components/MarketOverviewTab";
import { ProductTableTab } from "./components/ProductTableTab";
import { AIInsightsTab } from "./components/AIInsightsTab";
import { HistoryStrip } from "./components/HistoryStrip";
import { HistoryView } from "./components/HistoryView";
import type {
 HistoryStripItem,
 MarketJob,
 MarketProduct,
 MarketAnalysisDto,
} from "./components/types";

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

type View = "input" | "processing" | "result" | "history";

const STORAGE_KEY = "pixii-market-estimator-last-job";

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

function parseMarketAnalysis(ma: unknown): MarketAnalysisDto {
 const o = ma && typeof ma === "object" ? (ma as Record<string, unknown>) : {};
 return {
 totalMarketSizeMonthly: Number(o.totalMarketSizeMonthly ?? 0),
 totalMarketSizeAnnual: Number(o.totalMarketSizeAnnual ?? 0),
 averagePrice: Number(o.averagePrice ?? 0),
 averageRating: Number(o.averageRating ?? 0),
 averageReviewCount: Number(o.averageReviewCount ?? 0),
 marketConcentrationScore: Number(o.marketConcentrationScore ?? 0),
 entryDifficultyScore: Number(o.entryDifficultyScore ?? 0),
 opportunityScore: Number(o.opportunityScore ?? 0),
 opportunityGaps: Array.isArray(o.opportunityGaps)
 ? (o.opportunityGaps as unknown[]).map(String)
 : [],
 marketTrends: Array.isArray(o.marketTrends)
 ? (o.marketTrends as unknown[]).map(String)
 : [],
 entryStrategy: String(o.entryStrategy ?? ""),
 keyInsight: String(o.keyInsight ?? ""),
 competitionLevel: String(o.competitionLevel ?? "medium"),
 };
}

function parseProduct(p: unknown): MarketProduct {
 const o = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
 return {
 rank: Number(o.rank ?? 0),
 asin: String(o.asin ?? ""),
 title: String(o.title ?? ""),
 brand: String(o.brand ?? ""),
 price: Number(o.price ?? 0),
 rating: Number(o.rating ?? 0),
 reviewCount: Number(o.reviewCount ?? 0),
 imageUrl: String(o.imageUrl ?? ""),
 estimatedMonthlySales: Number(o.estimatedMonthlySales ?? 0),
 estimatedMonthlyRevenue: Number(o.estimatedMonthlyRevenue ?? 0),
 url: String(o.url ?? ""),
 };
}

function normalizeJob(raw: Record<string, unknown>): MarketJob {
 const products = Array.isArray(raw.products)
 ? raw.products.map(parseProduct)
 : [];
 return {
 _id: String(raw._id ?? ""),
 amazonUrl: String(raw.amazonUrl ?? ""),
 category: String(raw.category ?? ""),
 subcategory: String(raw.subcategory ?? ""),
 products,
 marketAnalysis: parseMarketAnalysis(raw.marketAnalysis),
 status: String(raw.status ?? ""),
 currentStep: Number(raw.currentStep ?? 1),
 errorMessage:
 raw.errorMessage != null ? String(raw.errorMessage) : undefined,
 createdAt:
 raw.createdAt != null
 ? new Date(raw.createdAt as string | number | Date).toISOString()
 : undefined,
 };
}

export default function MarketEstimatorPage() {
 const [view, setView] = useState<View>("input");
 const [urlInput, setUrlInput] = useState("");
 const [submittedUrl, setSubmittedUrl] = useState("");
 const [jobId, setJobId] = useState<string | null>(null);
 const [job, setJob] = useState<MarketJob | null>(null);
 const [tab, setTab] = useState<"overview" | "products" | "insights">(
 "overview",
 );
 const [elapsedSec, setElapsedSec] = useState(0);
 const [busyHistoryId, setBusyHistoryId] = useState<string | null>(null);
 const [resumeDismissed, setResumeDismissed] = useState(false);
 const [resumeOffer, setResumeOffer] = useState<{
 jobId: string;
 category: string;
 } | null>(null);
 const [toast, setToast] = useState<{
 message: string;
 variant: "success" | "error";
 } | null>(null);

 const pollTimerRef = useRef<number | null>(null);
 const elapsedTimerRef = useRef<number | null>(null);
 const urlValid = useDebouncedUrlValid(urlInput);

 const { data: historyData, mutate: mutateHistory } = useSWR<{
 items: HistoryStripItem[];
 }>("/api/market-estimator/history", fetchJson, { revalidateOnFocus: true });

 const resetToInput = useCallback(() => {
 setView("input");
 setJobId(null);
 setJob(null);
 setSubmittedUrl("");
 setElapsedSec(0);
 setTab("overview");
 }, []);

 const loadJob = useCallback(async (id: string) => {
 const raw = await fetchJson<Record<string, unknown>>(
 `/api/market-estimator/status/${id}`,
 );
 setJob(normalizeJob(raw));
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
 void fetchJson<Record<string, unknown>>(`/api/market-estimator/status/${id}`)
 .then((doc) => {
 if (cancelled || doc.status !== "complete") {
 return;
 }
 const cat = String(doc.category ?? "");
 if (cat) {
 setResumeOffer({ jobId: id, category: cat });
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
 `/api/market-estimator/status/${jobId}`,
 );
 if (cancelled) {
 return;
 }
 const j = normalizeJob(raw);
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

 poll();
 pollTimerRef.current = window.setInterval(poll, 3000);
 return () => {
 cancelled = true;
 if (pollTimerRef.current) {
 window.clearInterval(pollTimerRef.current);
 pollTimerRef.current = null;
 }
 };
 }, [view, jobId, mutateHistory]);

 const onAnalyze = useCallback(async () => {
 const url = urlInput.trim();
 if (!urlValid) {
 return;
 }
 setToast(null);
 try {
 const res = await fetchJson<{ jobId: string }>(
 "/api/market-estimator/submit",
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ amazonUrl: url }),
 },
 );
 setSubmittedUrl(url);
 setJobId(res.jobId);
 setJob(null);
 setView("processing");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not start analysis.",
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
 setTab("overview");
 } catch (e) {
 setToast({
 message: e instanceof Error ? e.message : "Could not load analysis.",
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
 await fetchJson(`/api/market-estimator/history/${id}`, {
 method: "DELETE",
 });
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

 const categoryChip =
 job?.category ||
 (submittedUrl ? extractCategoryFromUrl(submittedUrl).category : "");

 const analyzeTabActive = view !== "history";
 const processingLocked = view === "processing";

 useEffect(() => {
 if (!toast) {
 return;
 }
 const t = window.setTimeout(() => setToast(null), 3800);
 return () => window.clearTimeout(t);
 }, [toast]);

 return (
 <>
 <div className="relative min-h-full overflow-x-hidden">
 <GridBackdrop />
 <div className="relative z-10 px-5 py-7 md:px-8 md:py-9">
 <header className="border-b border-border/70 pb-6">
 <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
 Amazon
 </p>
 <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
 Market size estimator
 </h1>
 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
 Paste any Amazon Best Sellers category URL. See estimated monthly revenue for the
 top 10 and a concise read on market size and opportunity.
 </p>
 </header>

 <div
 className="mt-8 inline-flex rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
 role="tablist"
 aria-label="Markets sections"
 >
 <button
 type="button"
 role="tab"
 aria-selected={analyzeTabActive}
 className={segmentTabClass(analyzeTabActive)}
 onClick={() => setView("input")}
 >
 Analyze
 </button>
 <button
 type="button"
 role="tab"
 aria-selected={view === "history"}
 disabled={processingLocked}
 className={
 segmentTabClass(view === "history") +
 (processingLocked ? " cursor-not-allowed opacity-50" : "")
 }
 onClick={() => {
 if (!processingLocked) {
 setView("history");
 }
 }}
 >
 History
 </button>
 </div>

 <div className="mt-8 max-w-6xl space-y-6">
 {view === "input" && (
 <>
 <div className="flex flex-wrap gap-2">
 <span className="rounded-full border border-sky-200/90 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-950 dark:border-sky-500/35 dark:bg-sky-950/40 dark:text-sky-100">
 Top 10 competitors
 </span>
 <span className="rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100">
 Revenue estimates
 </span>
 <span className="rounded-full border border-violet-200/90 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
 AI market insights
 </span>
 </div>

 {resumeOffer && !resumeDismissed ? (
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm shadow-sm ring-1 ring-black/[0.03] dark:bg-primary/10 dark:ring-white/[0.06]">
 <p className="font-medium text-foreground">
 Resume last analysis:{" "}
 <span className="font-semibold text-primary">{resumeOffer.category}</span>
 </p>
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => void onOpenHistoryItem(resumeOffer.jobId)}
 className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 hover:bg-primary/90 dark:ring-white/15"
 >
 View results
 </button>
 <button
 type="button"
 onClick={() => setResumeDismissed(true)}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Dismiss
 </button>
 </div>
 </div>
 ) : null}

 <URLInput value={urlInput} onChange={setUrlInput} />

 <div className="grid gap-4 md:grid-cols-3">
 <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <p className="font-heading text-sm font-semibold text-foreground">
 Top 10 products
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 Ranked by estimated monthly revenue with pricing signals from the listing
 </p>
 </div>
 <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <p className="font-heading text-sm font-semibold text-foreground">
 Market size
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 Combined top-10 revenue and annualized market estimate
 </p>
 </div>
 <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <p className="font-heading text-sm font-semibold text-foreground">
 AI insights
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 Opportunity gaps, entry difficulty, and a practical entry angle
 </p>
 </div>
 </div>

 <p className="text-center text-xs text-muted-foreground">
 ~1–2 minutes · Top 10 · Four-step research pipeline
 </p>

 <button
 type="button"
 disabled={!urlValid}
 onClick={() => void onAnalyze()}
 className={primaryBtn}
 >
 Analyze market →
 </button>

 <p className="text-center text-[11px] text-muted-foreground">
 * Estimates use Best Sellers Rank. Directional research only.
 </p>

 <HistoryStrip
 items={historyData?.items ?? []}
 onSelect={(id) => void onOpenHistoryItem(id)}
 busyId={busyHistoryId}
 />
 </>
 )}

 {view === "processing" && (
 <ProcessingView
 category={categoryChip}
 status={job?.status ?? "queued"}
 currentStep={job?.currentStep ?? 1}
 errorMessage={job?.errorMessage ?? null}
 elapsedSec={elapsedSec}
 onTryAgain={resetToInput}
 />
 )}

 {view === "result" && job && job.status === "complete" ? (
 <>
 <div className="rounded-xl border border-border/80 bg-muted/50 px-4 py-3 text-sm shadow-sm ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.05]">
 <p className="font-heading font-semibold text-foreground">{job.category}</p>
 <p className="mt-1 truncate text-xs text-muted-foreground" title={job.amazonUrl}>
 {job.amazonUrl}
 </p>
 </div>

 <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25">
 <button
 type="button"
 className={resultTabClass(tab === "overview")}
 onClick={() => setTab("overview")}
 >
 Market overview
 </button>
 <button
 type="button"
 className={resultTabClass(tab === "products")}
 onClick={() => setTab("products")}
 >
 Top 10 products
 </button>
 <button
 type="button"
 className={resultTabClass(tab === "insights")}
 onClick={() => setTab("insights")}
 >
 AI insights
 </button>
 </div>

 {tab === "overview" ? <MarketOverviewTab job={job} /> : null}
 {tab === "products" ? <ProductTableTab job={job} /> : null}
 {tab === "insights" ? <AIInsightsTab job={job} /> : null}

 <button type="button" onClick={resetToInput} className={secondaryBtn + " w-full"}>
 ← Analyze another market
 </button>

 <HistoryStrip
 items={historyData?.items ?? []}
 onSelect={(id) => void onOpenHistoryItem(id)}
 busyId={busyHistoryId}
 />
 </>
 ) : null}

 {view === "history" ? (
 <HistoryView
 items={historyData?.items ?? []}
 onView={(id) => void onOpenHistoryItem(id)}
 onDelete={(id) => void onDeleteHistory(id)}
 busyId={busyHistoryId}
 />
 ) : null}
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
