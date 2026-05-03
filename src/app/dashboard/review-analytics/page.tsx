"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import { URLInput, useDebouncedAmazonProductUrlValid } from "./components/URLInput";
import { ProcessingView } from "./components/ProcessingView";
import { PurchaseCriteriaTab } from "./components/PurchaseCriteriaTab";
import { CompetitorTableTab } from "./components/CompetitorTableTab";
import { ReviewThemesTab } from "./components/ReviewThemesTab";
import { ActionPlanTab } from "./components/ActionPlanTab";
import { HistoryStrip } from "./components/HistoryStrip";
import { HistoryView } from "./components/HistoryView";
import type {
  HistoryStripItem,
  MarketIntelDto,
  PurchaseCriteriaRow,
  ReviewJob,
  ReviewListingRow,
} from "./components/types";

type View = "input" | "processing" | "result" | "history";

const STORAGE_KEY = "pixii-review-analytics-last-job";

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

function parseListingRow(p: unknown): ReviewListingRow {
  const o = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
  return {
    asin: String(o.asin ?? ""),
    title: String(o.title ?? ""),
    brand: String(o.brand ?? ""),
    price: Number(o.price ?? 0),
    rating: Number(o.rating ?? 0),
    reviewCount: Number(o.reviewCount ?? 0),
    imageUrl: String(o.imageUrl ?? ""),
    url: String(o.url ?? ""),
    bulletPoints: Array.isArray(o.bulletPoints)
      ? (o.bulletPoints as unknown[]).map(String)
      : [],
    bsr: Number(o.bsr ?? 999999),
    estimatedMonthlySales: Number(o.estimatedMonthlySales ?? 0),
    estimatedMonthlyRevenue: Number(o.estimatedMonthlyRevenue ?? 0),
    isUserListing: Boolean(o.isUserListing),
    reviewsScraped: Number(o.reviewsScraped ?? 0),
    avgSentimentScore: Number(o.avgSentimentScore ?? 0),
  };
}

function parseCriteria(p: unknown): PurchaseCriteriaRow {
  const o = p && typeof p === "object" ? (p as Record<string, unknown>) : {};
  return {
    criteriaName: String(o.criteriaName ?? ""),
    importanceScore: Number(o.importanceScore ?? 0),
    satisfactionScore: Number(o.satisfactionScore ?? 0),
    mentionCount: Number(o.mentionCount ?? 0),
    topPositiveQuote: String(o.topPositiveQuote ?? ""),
    topNegativeQuote: String(o.topNegativeQuote ?? ""),
    yourListingScore: Number(o.yourListingScore ?? 0),
    competitorAvgScore: Number(o.competitorAvgScore ?? 0),
  };
}

function parseMarketIntel(ma: unknown): MarketIntelDto {
  const o = ma && typeof ma === "object" ? (ma as Record<string, unknown>) : {};
  return {
    topPraisedFeatures: Array.isArray(o.topPraisedFeatures)
      ? (o.topPraisedFeatures as unknown[]).map(String)
      : [],
    topComplaints: Array.isArray(o.topComplaints)
      ? (o.topComplaints as unknown[]).map(String)
      : [],
    unmetNeeds: Array.isArray(o.unmetNeeds) ? (o.unmetNeeds as unknown[]).map(String) : [],
    yourStrengths: Array.isArray(o.yourStrengths)
      ? (o.yourStrengths as unknown[]).map(String)
      : [],
    yourWeaknesses: Array.isArray(o.yourWeaknesses)
      ? (o.yourWeaknesses as unknown[]).map(String)
      : [],
    listingImprovements: Array.isArray(o.listingImprovements)
      ? (o.listingImprovements as unknown[]).map(String)
      : [],
    keyInsight: String(o.keyInsight ?? ""),
    marketSentimentScore: Number(o.marketSentimentScore ?? 0),
    reviewVelocityTrend: String(o.reviewVelocityTrend ?? "stable"),
  };
}

function normalizeJob(raw: Record<string, unknown>): ReviewJob {
  const listings = Array.isArray(raw.listings)
    ? raw.listings.map(parseListingRow)
    : [];
  const purchaseCriteria = Array.isArray(raw.purchaseCriteria)
    ? raw.purchaseCriteria.map(parseCriteria)
    : [];
  return {
    _id: String(raw._id ?? ""),
    amazonUrl: String(raw.amazonUrl ?? ""),
    userAsin: String(raw.userAsin ?? ""),
    category: String(raw.category ?? ""),
    listings,
    purchaseCriteria,
    marketIntelligence: parseMarketIntel(raw.marketIntelligence),
    status: String(raw.status ?? ""),
    currentStep: Number(raw.currentStep ?? 1),
    totalReviewsScraped: Number(raw.totalReviewsScraped ?? 0),
    totalListingsScraped: Number(raw.totalListingsScraped ?? 0),
    errorMessage:
      raw.errorMessage != null ? String(raw.errorMessage) : undefined,
    createdAt:
      raw.createdAt != null
        ? new Date(raw.createdAt as string | number | Date).toISOString()
        : undefined,
    completedAt:
      raw.completedAt != null
        ? new Date(raw.completedAt as string | number | Date).toISOString()
        : undefined,
  };
}

export default function ReviewAnalyticsPage() {
  const [view, setView] = useState<View>("input");
  const [urlInput, setUrlInput] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ReviewJob | null>(null);
  const [tab, setTab] = useState<"criteria" | "table" | "themes" | "plan">("criteria");
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

  const { data: historyData, mutate: mutateHistory } = useSWR<{ items: HistoryStripItem[] }>(
    "/api/review-analytics/history",
    fetchJson,
    { revalidateOnFocus: true },
  );

  const resetToInput = useCallback(() => {
    setView("input");
    setJobId(null);
    setJob(null);
    setElapsedSec(0);
    setTab("criteria");
  }, []);

  const loadJob = useCallback(async (id: string) => {
    const raw = await fetchJson<Record<string, unknown>>(`/api/review-analytics/status/${id}`);
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
    void fetchJson<Record<string, unknown>>(`/api/review-analytics/status/${id}`)
      .then((doc) => {
        if (cancelled || doc.status !== "complete") {
          return;
        }
        const listings = Array.isArray(doc.listings) ? doc.listings : [];
        const first = listings[0] as { title?: string; isUserListing?: boolean } | undefined;
        const user = listings.find(
          (l: { isUserListing?: boolean }) => l.isUserListing,
        ) as { title?: string } | undefined;
        const title = String((user ?? first)?.title ?? "").slice(0, 48);
        if (title) {
          setResumeOffer({ jobId: id, title });
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
          `/api/review-analytics/status/${jobId}`,
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

  const onAnalyze = useCallback(async () => {
    const url = urlInput.trim();
    if (!urlValid) {
      return;
    }
    setToast(null);
    try {
      const res = await fetchJson<{ jobId: string }>("/api/review-analytics/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amazonUrl: url }),
      });
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
        setTab("criteria");
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
        await fetchJson(`/api/review-analytics/history/${id}`, { method: "DELETE" });
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

  const asinChip = job?.userAsin ?? extractAsin(urlInput.trim()) ?? "";
  const listingsCount = job?.listings?.length ?? 0;
  const competitorCount = Math.max(0, listingsCount - 1);
  const userListing =
    job?.listings.find((l) => l.isUserListing) ?? job?.listings[0] ?? null;
  const titleHead =
    userListing?.title && userListing.title.length > 60
      ? `${userListing.title.slice(0, 60)}…`
      : (userListing?.title ?? "Your product");

  const tabBtn = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary text-white shadow-sm"
        : "border border-border bg-card text-foreground hover:bg-muted"
    }`;

  return (
    <>
      <FeaturePage
        title={
          <span className="flex flex-wrap items-center gap-3">
            Review Analytics
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
        description="Paste your Amazon listing URL. We'll scrape your listing, find 9 competitors, pull 1000+ reviews, and tell you exactly what customers care about."
      >
        <div className="mt-6 max-w-6xl space-y-6">
          {view === "input" && (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                  🏆 10 listings analyzed
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900">
                  💬 1000+ reviews scraped
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  🧠 AI purchase criteria
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  💰 Revenue estimates
                </span>
              </div>

              {resumeOffer && !resumeDismissed ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">
                    Resume last analysis:{" "}
                    <span className="font-semibold text-primary">{resumeOffer.title}</span>
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
                    🔍 Competitor Discovery
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Auto-finds 9 competing products from &apos;customers also bought&apos; data
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    💬 Review Intelligence
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    1000+ reviews analyzed for purchase criteria and sentiment patterns
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-foreground">📋 Action Plan</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Specific listing improvements based on what customers love about competitors
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                ⏱ ~3-5 minutes · 💬 1000+ reviews · 🏆 10 listings · 🤖 AI-powered analysis
              </p>

              {competitorCount < 3 && job?.totalListingsScraped ? (
                <p className="text-center text-xs text-amber-800">
                  Found {competitorCount} competitors — analysis continues with available
                  listings.
                </p>
              ) : null}

              <button
                type="button"
                disabled={!urlValid}
                onClick={() => void onAnalyze()}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
              >
                Analyze Reviews →
              </button>

              <HistoryStrip
                items={historyData?.items ?? []}
                onSelect={(id) => void onOpenHistoryItem(id)}
                busyId={busyHistoryId}
              />
            </>
          )}

          {view === "processing" && (
            <ProcessingView
              userAsin={asinChip}
              status={job?.status ?? "queued"}
              currentStep={job?.currentStep ?? 1}
              totalListingsScraped={job?.totalListingsScraped ?? 0}
              totalReviewsScraped={job?.totalReviewsScraped ?? 0}
              errorMessage={job?.errorMessage ?? null}
              elapsedSec={elapsedSec}
              onTryAgain={resetToInput}
            />
          )}

          {view === "result" && job && job.status === "complete" ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/80 px-4 py-3 text-sm">
                <p className="font-semibold text-foreground">{titleHead}</p>
                {job.userAsin ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {job.userAsin}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {job.totalReviewsScraped} reviews · {job.totalListingsScraped} listings
                {competitorCount < 3 ? (
                  <span className="ml-2 text-amber-800">
                    · Found {competitorCount} competitor{competitorCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </p>

              <div className="flex flex-wrap gap-2 border-b border-border pb-2">
                <button
                  type="button"
                  className={tabBtn(tab === "criteria")}
                  onClick={() => setTab("criteria")}
                >
                  🧠 Purchase Criteria
                </button>
                <button
                  type="button"
                  className={tabBtn(tab === "table")}
                  onClick={() => setTab("table")}
                >
                  🏆 Competitor Table
                </button>
                <button
                  type="button"
                  className={tabBtn(tab === "themes")}
                  onClick={() => setTab("themes")}
                >
                  💬 Review Themes
                </button>
                <button
                  type="button"
                  className={tabBtn(tab === "plan")}
                  onClick={() => setTab("plan")}
                >
                  📋 Action Plan
                </button>
              </div>

              {tab === "criteria" ? (
                <PurchaseCriteriaTab
                  criteria={job.purchaseCriteria}
                  keyInsight={job.marketIntelligence.keyInsight}
                />
              ) : null}
              {tab === "table" ? (
                <CompetitorTableTab listings={job.listings} userAsin={job.userAsin} />
              ) : null}
              {tab === "themes" && jobId ? (
                <ReviewThemesTab
                  intel={job.marketIntelligence}
                  jobId={jobId}
                  listings={job.listings}
                />
              ) : null}
              {tab === "plan" ? (
                <ActionPlanTab job={job} intel={job.marketIntelligence} criteria={job.purchaseCriteria} />
              ) : null}

              <button
                type="button"
                onClick={resetToInput}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
              >
                ← Analyze Another Product
              </button>

              <HistoryStrip
                items={historyData?.items ?? []}
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
                ← Back to analyze
              </button>
              <HistoryView
                items={historyData?.items ?? []}
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
