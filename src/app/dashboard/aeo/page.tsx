"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { GridBackdrop } from "@/components/GridBackdrop";
import { brandsMentionedCount, rankSummary } from "@/lib/aeo/competitorMatrix";
import type { AeoParsed } from "@/lib/aeo/types";
import type { AeoFullResult, AeoHistorySummary } from "./types";
import {
  loadBrandFromStorage,
  loadProductFromStorage,
  persistBrandProduct,
} from "./storage";
import { InputPanel } from "./components/InputPanel";
import { ProgressSteps } from "./components/ProgressSteps";
import { ScoreOverview } from "./components/ScoreOverview";
import {
  EngineCard,
  competitorNamesFromResult,
} from "./components/EngineCard";
import { CompetitorMatrix } from "./components/CompetitorMatrix";
import { Recommendations } from "./components/Recommendations";
import { RawResponses } from "./components/RawResponses";
import { HistoryList } from "./components/HistoryList";
import { ResultsSkeleton } from "./components/ResultsSkeleton";
import { TutorialVideoOverlay } from "./components/TutorialVideoOverlay";

const AEO_TUTORIAL_SEEN_KEY = "pixii_aeo_tutorial_seen";

const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
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

function asParsed(x: unknown): AeoParsed | null {
  if (!x || typeof x !== "object") {
    return null;
  }
  return x as AeoParsed;
}

function asRecord(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
}

function toFullResult(data: Record<string, unknown>): AeoFullResult {
  const createdRaw = data.createdAt;
  const createdAt =
    typeof createdRaw === "string"
      ? createdRaw
      : createdRaw instanceof Date
        ? createdRaw.toISOString()
        : new Date().toISOString();

  const meta = data.meta as AeoFullResult["meta"] | undefined;

  return {
    _id: String(data._id ?? ""),
    queryText: String(data.queryText ?? ""),
    brandName: String(data.brandName ?? ""),
    productName: String(data.productName ?? ""),
    overallScore: (data.overallScore as number | null) ?? null,
    gptScore: (data.gptScore as number | null) ?? null,
    claudeScore: (data.claudeScore as number | null) ?? null,
    geminiScore: (data.geminiScore as number | null) ?? null,
    gptRank: (data.gptRank as number | null) ?? null,
    claudeRank: (data.claudeRank as number | null) ?? null,
    geminiRank: (data.geminiRank as number | null) ?? null,
    gptRaw: String(data.gptRaw ?? ""),
    claudeRaw: String(data.claudeRaw ?? ""),
    geminiRaw: String(data.geminiRaw ?? ""),
    gptParsed: asRecord(data.gptParsed),
    claudeParsed: asRecord(data.claudeParsed),
    geminiParsed: asRecord(data.geminiParsed),
    competitors: Array.isArray(data.competitors)
      ? (data.competitors as AeoFullResult["competitors"])
      : [],
    recommendations: Array.isArray(data.recommendations)
      ? (data.recommendations as string[])
      : [],
    createdAt,
    meta,
  };
}

function segmentTabClass(active: boolean): string {
  return (
    "rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
  );
}

type View = "run" | "history";

export default function AeoDashboardPage() {
  const [view, setView] = useState<View>("run");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [queryText, setQueryText] = useState("");
  const [result, setResult] = useState<AeoFullResult | null>(null);
  const [running, setRunning] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [tutorialReady, setTutorialReady] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialIframeKey, setTutorialIframeKey] = useState(0);
  const [showPlayTutorialButton, setShowPlayTutorialButton] = useState(false);

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR<{ items: AeoHistorySummary[] }>("/api/aeo/history", fetchJson);

  useEffect(() => {
    setBrandName(loadBrandFromStorage());
    setProductName(loadProductFromStorage());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/aeo/config");
        const body = (await res.json()) as {
          config: {
            brandName?: string;
            productName?: string;
          } | null;
        };
        if (cancelled || !body.config) {
          return;
        }
        setBrandName((b) => b || (body.config?.brandName ?? ""));
        setProductName((p) => p || (body.config?.productName ?? ""));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistBrandProduct(brandName, productName);
  }, [brandName, productName]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    try {
      const seenBefore =
        window.localStorage.getItem(AEO_TUTORIAL_SEEN_KEY) === "1";
      setShowPlayTutorialButton(seenBefore);
      if (!seenBefore) {
        setTutorialIframeKey((k) => k + 1);
        setTutorialOpen(true);
      }
    } catch {
      setShowPlayTutorialButton(false);
      setTutorialIframeKey((k) => k + 1);
      setTutorialOpen(true);
    }
    setTutorialReady(true);
  }, []);

  const handleTutorialClose = useCallback(() => {
    setTutorialOpen(false);
    try {
      window.localStorage.setItem(AEO_TUTORIAL_SEEN_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    setShowPlayTutorialButton(true);
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }
    const id = window.setInterval(() => {
      setStepIndex((s) => Math.min(s + 1, 4));
    }, 800);
    return () => window.clearInterval(id);
  }, [running]);

  const pushToast = useCallback(
    (message: string, variant: "success" | "error") => {
      setToast({ message, variant });
    },
    [],
  );

  const derivedMeta = useMemo(() => {
    if (!result) {
      return null;
    }
    if (
      result.meta &&
      result.meta.rankSummary !== undefined &&
      result.meta.brandsMentionedCount !== undefined
    ) {
      return result.meta;
    }
    return {
      rankSummary: rankSummary(result.gptRank, result.claudeRank, result.geminiRank),
      brandsMentionedCount: brandsMentionedCount(
        asParsed(result.gptParsed),
        asParsed(result.claudeParsed),
        asParsed(result.geminiParsed),
      ),
      engineErrors: result.meta?.engineErrors,
    };
  }, [result]);

  const namesForHighlight = useMemo(
    () => (result ? competitorNamesFromResult(result) : []),
    [result],
  );

  const runDiagnostic = async () => {
    setRunning(true);
    setAllComplete(false);
    setStepIndex(0);
    setResult(null);
    try {
      const res = await fetch("/api/aeo/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryText,
          brandName,
          productName,
        }),
      });
      const body = (await res.json()) as Record<string, unknown> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Diagnostic failed",
        );
      }
      setResult(toFullResult(body));
      setAllComplete(true);
      setRunning(false);
      pushToast("AEO diagnostic complete", "success");
      void mutateHistory();
      try {
        void fetch("/api/aeo/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandName, productName }),
        });
      } catch {
        /* non-fatal */
      }
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Diagnostic failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const loadReport = async (id: string) => {
    try {
      const data = await fetchJson<Record<string, unknown>>(
        `/api/aeo/history/${id}`,
      );
      setResult(toFullResult(data));
      setView("run");
      pushToast("Report loaded", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Load failed", "error");
    }
  };

  const historyItems = historyData?.items;

  return (
    <>
      <div className="relative min-h-full overflow-x-hidden">
        <GridBackdrop />
        <div className="relative z-10 px-4 py-6 sm:px-5 sm:py-7 md:px-8 md:py-9">
          <header className="border-b border-border/70 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Intelligence
                </p>
                <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                  AEO Diagnostic
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Run a shopper query across GPT-4o, GPT-4o mini, and Gemini—then
                  review mentions, competitors, and prioritized fixes in one minimal
                  report.
                </p>
              </div>
              {tutorialReady && showPlayTutorialButton ? (
                <button
                  type="button"
                  onClick={() => {
                    setTutorialIframeKey((k) => k + 1);
                    setTutorialOpen(true);
                  }}
                  className={`${secondaryBtnClass} shrink-0 self-start`}
                >
                  Play tutorial
                </button>
              ) : null}
            </div>
          </header>

          <div
            className="mt-8 flex max-w-full flex-nowrap gap-1 overflow-x-auto scroll-smooth rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
            role="tablist"
            aria-label="AEO sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "run"}
              className={segmentTabClass(view === "run")}
              onClick={() => setView("run")}
            >
              Run diagnostic
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "history"}
              disabled={running}
              className={
                segmentTabClass(view === "history") +
                (running ? " cursor-not-allowed opacity-50" : "")
              }
              onClick={() => {
                if (!running) {
                  setView("history");
                }
              }}
            >
              History
            </button>
          </div>

          <div className="mt-8 max-w-6xl">
            {view === "history" ? (
              <section className="mt-2">
                <HistoryList
                  items={historyItems}
                  loading={historyLoading}
                  error={historyError}
                  onView={loadReport}
                  onDeleted={() => void mutateHistory()}
                  onToast={pushToast}
                />
              </section>
            ) : (
              <>
                <div className="mt-2">
                  <InputPanel
                    brandName={brandName}
                    productName={productName}
                    queryText={queryText}
                    onBrandChange={setBrandName}
                    onProductChange={setProductName}
                    onQueryChange={setQueryText}
                    onSubmit={() => void runDiagnostic()}
                    disabled={running}
                  />
                  <ProgressSteps
                    active={running}
                    currentIndex={stepIndex}
                    allComplete={allComplete}
                  />
                </div>

                {running && !result ? <ResultsSkeleton /> : null}

                {result ? (
                  <div className="mt-8 space-y-6">
                    <ScoreOverview
                      overallScore={result.overallScore}
                      rankSummary={derivedMeta?.rankSummary ?? null}
                      brandsMentionedCount={
                        derivedMeta?.brandsMentionedCount ?? 1
                      }
                      gptScore={result.gptScore}
                      claudeScore={result.claudeScore}
                      geminiScore={result.geminiScore}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <EngineCard
                        title="Claude — detailed"
                        icon="A"
                        score={result.gptScore}
                        unavailable={
                          Boolean(result.meta?.engineErrors?.gpt) ||
                          (result.gptScore === null && !result.gptRaw)
                        }
                        errorDetail={result.meta?.engineErrors?.gpt}
                        parsed={result.gptParsed}
                        raw={result.gptRaw}
                        brandName={result.brandName}
                        allCompetitorNames={namesForHighlight}
                      />
                      <EngineCard
                        title="Claude — concise"
                        icon="B"
                        score={result.claudeScore}
                        unavailable={
                          Boolean(result.meta?.engineErrors?.mini) ||
                          (result.claudeScore === null && !result.claudeRaw)
                        }
                        errorDetail={result.meta?.engineErrors?.mini}
                        parsed={result.claudeParsed}
                        raw={result.claudeRaw}
                        brandName={result.brandName}
                        allCompetitorNames={namesForHighlight}
                      />
                      <EngineCard
                        title={
                          result.meta?.anthropicModel
                            ? `Claude — brands (${result.meta.anthropicModel})`
                            : "Claude — brands"
                        }
                        icon="C"
                        score={result.geminiScore}
                        unavailable={
                          Boolean(result.meta?.engineErrors?.gemini) ||
                          (result.geminiScore === null && !result.geminiRaw)
                        }
                        errorDetail={result.meta?.engineErrors?.gemini}
                        parsed={result.geminiParsed}
                        raw={result.geminiRaw}
                        brandName={result.brandName}
                        allCompetitorNames={namesForHighlight}
                      />
                    </div>

                    <CompetitorMatrix
                      brandName={result.brandName}
                      rows={result.competitors}
                    />

                    <Recommendations items={result.recommendations} />

                    <RawResponses
                      gptRaw={result.gptRaw}
                      claudeRaw={result.claudeRaw}
                      geminiRaw={result.geminiRaw}
                      brandName={result.brandName}
                      competitorNames={namesForHighlight}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {tutorialReady ? (
        <TutorialVideoOverlay
          open={tutorialOpen}
          onClose={handleTutorialClose}
          autoplay
          iframeKey={tutorialIframeKey}
        />
      ) : null}

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
