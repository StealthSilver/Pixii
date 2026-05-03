"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
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

  const tabBtn = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-primary text-white shadow-sm"
        : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
    }`;

  return (
    <>
      <FeaturePage
        title={
          <span className="flex flex-wrap items-center gap-3">
            Market Size Estimator
            {view !== "processing" ? (
              <button
                type="button"
                onClick={() => setView("history")}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                History
              </button>
            ) : null}
          </span>
        }
        description="Paste any Amazon Best Sellers page URL and get the estimated monthly revenue of the entire market and top 10 competitors."
      >
        <div className="mt-6 max-w-6xl space-y-6">
          {view === "input" && (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                  🏆 Top 10 competitors
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  💰 Revenue estimates
                </span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900">
                  🤖 AI market insights
                </span>
              </div>

              {resumeOffer && !resumeDismissed ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm">
                  <p className="font-medium text-neutral-900">
                    Resume last analysis:{" "}
                    <span className="font-semibold text-primary">
                      {resumeOffer.category}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onOpenHistoryItem(resumeOffer.jobId)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeDismissed(true)}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              <URLInput value={urlInput} onChange={setUrlInput} />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-black">
                    🏆 Top 10 Products
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    Ranked by estimated monthly revenue with real pricing data
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-black">
                    💰 Market Size
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    Total monthly revenue of the top 10 and annualized market
                    estimate
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="font-heading text-sm font-semibold text-black">
                    🤖 AI Insights
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    Opportunity gaps, entry difficulty, and recommended strategy
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-neutral-500">
                ⏱ ~1-2 minutes · 📊 Top 10 analysis · 🔍 4-step research pipeline
              </p>

              <button
                type="button"
                disabled={!urlValid}
                onClick={() => void onAnalyze()}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
              >
                Analyze Market →
              </button>

              <p className="text-center text-[11px] text-neutral-500">
                * Estimates based on Best Sellers Rank position. For directional
                research only.
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
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm">
                <p className="font-semibold text-black">{job.category}</p>
                <p className="mt-1 truncate text-xs text-neutral-600" title={job.amazonUrl}>
                  {job.amazonUrl}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
                <button
                  type="button"
                  className={tabBtn(tab === "overview")}
                  onClick={() => setTab("overview")}
                >
                  💰 Market Overview
                </button>
                <button
                  type="button"
                  className={tabBtn(tab === "products")}
                  onClick={() => setTab("products")}
                >
                  🏆 Top 10 Products
                </button>
                <button
                  type="button"
                  className={tabBtn(tab === "insights")}
                  onClick={() => setTab("insights")}
                >
                  🤖 AI Insights
                </button>
              </div>

              {tab === "overview" ? <MarketOverviewTab job={job} /> : null}
              {tab === "products" ? <ProductTableTab job={job} /> : null}
              {tab === "insights" ? <AIInsightsTab job={job} /> : null}

              <button
                type="button"
                onClick={resetToInput}
                className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                ← Analyze Another Market
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
                className="text-sm font-semibold text-neutral-600 hover:text-black"
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
