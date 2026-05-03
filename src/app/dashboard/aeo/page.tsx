"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
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
      // Clear loading before SWR/config work so the UI is not stuck behind
      // `result && !running` while history revalidates (which can be slow).
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
      <FeaturePage
        title="AEO Diagnostic"
        description="Run a shopper query across GPT-4o, GPT-4o mini, and Gemini, then review mentions, competitors, and prioritized fixes."
      >
        <div className="mt-6 max-w-6xl">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setView(view === "history" ? "run" : "history")}
              className={
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
                (view === "history"
                  ? "bg-primary/10 text-primary"
                  : "border border-border bg-card text-foreground/90 shadow-sm hover:bg-foreground/[0.06]")
              }
            >
              {view === "history" ? "Run diagnostic" : "History"}
            </button>
          </div>

          {view === "history" ? (
            <section className="mt-8">
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
              <div className="mt-6">
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
                  {result.meta?.usedGeminiForOpenAiSlots &&
                  (result.meta.usedGeminiForOpenAiSlots.gpt ||
                    result.meta.usedGeminiForOpenAiSlots.mini) ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      Demo note: OpenAI hit quota or was skipped, so the{" "}
                      <strong>GPT-4o</strong> and/or <strong>GPT-4o mini</strong>{" "}
                      answers below were generated with{" "}
                      <strong>
                        Gemini ({result.meta.geminiModel ?? "Gemini"})
                      </strong>{" "}
                      instead (same free-tier key as the third column).
                    </p>
                  ) : null}
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
                      title="GPT-4o"
                      icon="G"
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
                      title="GPT-4o mini"
                      icon="M"
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
                        result.meta?.geminiModel
                          ? `Gemini (${result.meta.geminiModel})`
                          : "Gemini"
                      }
                      icon="◆"
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
