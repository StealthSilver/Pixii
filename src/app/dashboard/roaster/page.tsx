"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { BetaFeatureNotice } from "@/components/BetaFeatureNotice";
import { GridBackdrop } from "@/components/GridBackdrop";
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

  const roastTabActive = view !== "history";
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
          <BetaFeatureNotice />
          <header className="border-b border-border/70 pb-6">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Content
            </p>
            <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Roaster
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Paste your Amazon listing URL. Get a direct video critique with a
              prioritized fix list—minimal noise, maximum clarity.
            </p>
          </header>

          <div
            className="mt-8 inline-flex rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
            role="tablist"
            aria-label="Roaster sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={roastTabActive}
              className={segmentTabClass(roastTabActive)}
              onClick={() => setView("input")}
            >
              Roast
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
                    60–90s video critique
                  </span>
                  <span className="rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/40 dark:text-amber-100">
                    Listing score + grade
                  </span>
                  <span className="rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100">
                    Suggested rewrites
                  </span>
                </div>

                {resumeOffer && !resumeDismissed ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm shadow-sm ring-1 ring-black/[0.03] dark:bg-primary/10 dark:ring-white/[0.06]">
                    <p className="font-medium text-foreground">
                      Resume last roast:{" "}
                      <span className="font-semibold text-primary">
                        {resumeOffer.title.length > 48
                          ? `${resumeOffer.title.slice(0, 48)}…`
                          : resumeOffer.title}
                      </span>
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
                      Listing grade
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Overall score A–F with subscores for every listing element
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
                    <p className="font-heading text-sm font-semibold text-foreground">
                      Video critique
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Short direct video—no filler, no false encouragement
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
                    <p className="font-heading text-sm font-semibold text-foreground">
                      Rewrites included
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Title, bullets, and description opening—ready to copy
                    </p>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  ~3–5 minutes · 60–90s video · Rewrites for weak elements
                </p>

                <button
                  type="button"
                  disabled={!urlValid}
                  onClick={() => void onRoast()}
                  className={primaryBtn}
                >
                  Roast my listing →
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
                  <h2 className="min-w-0 flex-1 font-heading text-lg font-semibold tracking-tight text-foreground">
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
                  <p className="text-sm text-muted-foreground">
                    {job.listingData.brand}
                  </p>
                ) : null}

                <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25">
                  <button
                    type="button"
                    className={resultTabClass(resultTab === "video")}
                    onClick={() => setResultTab("video")}
                  >
                    Critique video
                  </button>
                  <button
                    type="button"
                    className={resultTabClass(resultTab === "score")}
                    onClick={() => setResultTab("score")}
                  >
                    Listing score
                  </button>
                  <button
                    type="button"
                    className={resultTabClass(resultTab === "rewrites")}
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
                  className={secondaryBtn + " w-full"}
                >
                  ← Roast another listing
                </button>

                <HistoryStrip
                  items={historyStripItems}
                  onSelect={(id) => void onOpenHistoryItem(id)}
                  busyId={busyHistoryId}
                />
              </>
            ) : null}

            {view === "history" ? (
              <HistoryView
                items={historyStripItems}
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
