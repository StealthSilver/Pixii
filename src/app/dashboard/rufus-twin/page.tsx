"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type {
  CompetitorProduct,
  ListingScore,
  ResponseFactor,
  RufusSimulationResult,
} from "@/lib/rufusTwin/types";
import { CompetitorGrid } from "./components/CompetitorGrid";
import type { ListingFormState } from "./components/ListingInputPanel";
import { HistoryList, type RufusHistoryRow } from "./components/HistoryList";
import { ListingScoreCard } from "./components/ListingScoreCard";
import { ProgressSteps } from "./components/ProgressSteps";
import { QueryInput } from "./components/QueryInput";
import { RankingFactors } from "./components/RankingFactors";
import { RelatedQuestions } from "./components/RelatedQuestions";
import { RufusResponseCard } from "./components/RufusResponseCard";

const LS_QUERY = "rufusTwin_queryText";
const LS_LISTING = "rufusTwin_listing";

type MainView = "query" | "history";
type QueryPhase = "idle" | "loading" | "result";

type SimulateResponse = RufusSimulationResult & { _id: string };

const EMPTY_LISTING: ListingFormState = {
  title: "",
  bulletsText: "",
  description: "",
  category: "",
  asin: "",
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

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildProductDetails(listing: ListingFormState) {
  if (!listing.title.trim()) {
    return undefined;
  }
  return {
    asin: listing.asin.trim() || undefined,
    title: listing.title.trim(),
    bullets: listing.bulletsText.split(/\r?\n/).map((l) => l.trim()),
    description: listing.description.trim(),
    category: listing.category.trim(),
  };
}

function mapDocToResult(
  doc: Record<string, unknown>,
): { result: RufusSimulationResult; _id: string } {
  const factors = Array.isArray(doc.responseFactors)
    ? (doc.responseFactors as ResponseFactor[])
    : [];
  const competitors = Array.isArray(doc.competitorProducts)
    ? (doc.competitorProducts as CompetitorProduct[])
    : [];
  const listingScore =
    doc.listingScore &&
    typeof doc.listingScore === "object" &&
    doc.listingScore !== null
      ? (doc.listingScore as ListingScore)
      : null;
  const related = Array.isArray(doc.relatedQuestions)
    ? (doc.relatedQuestions as string[])
    : [];

  return {
    _id: String(doc._id),
    result: {
      queryType: String(doc.queryType ?? ""),
      category: String(doc.category ?? ""),
      simulatedResponse: String(doc.simulatedResponse ?? ""),
      responseFactors: factors,
      competitorProducts: competitors,
      listingScore,
      relatedQuestions: related,
    },
  };
}

export default function RufusTwinPage() {
  const [mainView, setMainView] = useState<MainView>("query");
  const [queryPhase, setQueryPhase] = useState<QueryPhase>("idle");
  const [queryText, setQueryText] = useState("");
  const [listingOpen, setListingOpen] = useState(false);
  const [listing, setListing] = useState<ListingFormState>(EMPTY_LISTING);
  const [result, setResult] = useState<RufusSimulationResult | null>(null);
  const [queryId, setQueryId] = useState<string | null>(null);
  const [savedForId, setSavedForId] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const [step1Complete, setStep1Complete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [historyReadOnly, setHistoryReadOnly] = useState(false);
  const [historyBannerAt, setHistoryBannerAt] = useState<string | null>(null);

  const querySectionRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number>(0);

  const {
    data: historyData,
    error: historyError,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR<{ items: RufusHistoryRow[] }>(
    "/api/rufus-twin/history",
    (url) => fetchJson(url),
    { revalidateOnFocus: true },
  );

  useEffect(() => {
    try {
      const q = localStorage.getItem(LS_QUERY);
      if (q) {
        setQueryText(q);
      }
      const raw = localStorage.getItem(LS_LISTING);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ListingFormState>;
        setListing({
          title: typeof parsed.title === "string" ? parsed.title : "",
          bulletsText:
            typeof parsed.bulletsText === "string" ? parsed.bulletsText : "",
          description:
            typeof parsed.description === "string" ? parsed.description : "",
          category: typeof parsed.category === "string" ? parsed.category : "",
          asin: typeof parsed.asin === "string" ? parsed.asin : "",
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_QUERY, queryText);
    } catch {
      /* ignore */
    }
  }, [queryText]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_LISTING, JSON.stringify(listing));
    } catch {
      /* ignore */
    }
  }, [listing]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const loading = queryPhase === "loading";

  useEffect(() => {
    if (!loading) {
      return;
    }
    startedAtRef.current = Date.now();
    setStep1Complete(false);
    setElapsedMs(0);
    const tick = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 500);
    const t1 = window.setTimeout(() => setStep1Complete(true), 1200);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(t1);
    };
  }, [loading]);

  const pushToast = useCallback(
    (message: string, variant: "success" | "error") => {
      setToast({ message, variant });
    },
    [],
  );

  const runSimulate = useCallback(
    async (text: string, opts?: { fromRelated?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) {
        pushToast("Enter a question first.", "error");
        return;
      }
      const fromRelated = Boolean(opts?.fromRelated);
      if (fromRelated) {
        setRelatedLoading(true);
      } else {
        setQueryPhase("loading");
        setResult(null);
        setQueryId(null);
        setSavedForId(null);
      }

      try {
        const pd = buildProductDetails(listing);
        const data = await fetchJson<SimulateResponse>(
          "/api/rufus-twin/simulate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queryText: trimmed,
              productDetails: pd,
            }),
          },
        );
        const { _id, ...rest } = data;
        setResult(rest);
        setQueryId(_id);
        setSavedForId(null);
        setQueryPhase("result");
        void mutateHistory();
        if (fromRelated) {
          pushToast("Simulation updated", "success");
        }
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Simulation failed", "error");
        if (!fromRelated) {
          setQueryPhase("idle");
        }
      } finally {
        if (fromRelated) {
          setRelatedLoading(false);
        }
      }
    },
    [listing, mutateHistory, pushToast],
  );

  const onSubmit = () => void runSimulate(queryText);

  const onRelatedSelect = (q: string) => {
    setQueryText(q);
    void runSimulate(q, { fromRelated: true });
  };

  const resetIdle = () => {
    setQueryPhase("idle");
    setResult(null);
    setQueryId(null);
    setSavedForId(null);
    setHistoryReadOnly(false);
    setHistoryBannerAt(null);
    setStep1Complete(false);
  };

  const onNewQuery = () => {
    resetIdle();
  };

  const scrollToQuery = () => {
    setListingOpen(true);
    window.requestAnimationFrame(() => {
      querySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const onSave = async () => {
    if (!queryId) {
      return;
    }
    try {
      await fetchJson("/api/rufus-twin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryId }),
      });
      setSavedForId(queryId);
      pushToast("Query saved", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Save failed", "error");
    }
  };

  const onCopy = async () => {
    if (!result?.simulatedResponse) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.simulatedResponse);
      setCopyLabel("Copied!");
      window.setTimeout(() => setCopyLabel(null), 2000);
    } catch {
      pushToast("Could not copy to clipboard.", "error");
    }
  };

  const onRunAgain = () => void runSimulate(queryText);

  const loadHistoryItem = async (id: string) => {
    try {
      const doc = await fetchJson<Record<string, unknown>>(
        `/api/rufus-twin/history/${id}`,
      );
      const qt = String(doc.queryText ?? "");
      setQueryText(qt);
      const mapped = mapDocToResult(doc);
      setResult(mapped.result);
      setQueryId(mapped._id);
      setSavedForId(doc.savedAt != null && doc.savedAt !== "" ? mapped._id : null);
      setHistoryReadOnly(true);
      setHistoryBannerAt(
        typeof doc.createdAt === "string"
          ? doc.createdAt
          : new Date().toISOString(),
      );
      setMainView("query");
      setQueryPhase("result");
      pushToast("Loaded saved query", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Load failed", "error");
    }
  };

  const dismissHistoryBanner = () => {
    resetIdle();
  };

  const historyItems = historyData?.items;

  return (
    <>
      <FeaturePage
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>Rufus Twin</span>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Amazon Rufus Simulator
            </span>
          </span>
        }
        description="Simulate how Amazon's AI shopping assistant answers shopper questions — and optimize your listing to rank in those answers."
      >
        <div ref={querySectionRef} className="mt-6 max-w-6xl">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setMainView(mainView === "history" ? "query" : "history")
              }
              className={
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
                (mainView === "history"
                  ? "bg-primary/10 text-primary"
                  : "border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-black/[0.03]")
              }
            >
              {mainView === "history" ? "Query" : "History"}
            </button>
          </div>

          {mainView === "history" ? (
            <section className="mt-8">
              <HistoryList
                items={historyItems}
                loading={historyLoading}
                error={historyError}
                onView={(id) => void loadHistoryItem(id)}
                onDeleted={() => void mutateHistory()}
                onToast={pushToast}
                onAskRufus={() => setMainView("query")}
              />
            </section>
          ) : (
            <>
              {historyBannerAt ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950">
                  <span>
                    Viewing saved query from{" "}
                    <strong>{formatRelativeTime(historyBannerAt)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={dismissHistoryBanner}
                    className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100/80"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ) : null}

              <div className="mt-6">
                <QueryInput
                  queryText={queryText}
                  onQueryChange={(v) => {
                    if (!historyReadOnly) {
                      setQueryText(v);
                    }
                  }}
                  inputReadOnly={historyReadOnly}
                  listingDisabled={historyReadOnly}
                  listingOpen={listingOpen}
                  onListingToggle={() => setListingOpen((o) => !o)}
                  listing={listing}
                  onListingChange={setListing}
                  onSubmit={onSubmit}
                  disabled={loading || relatedLoading}
                  showSubmit={queryPhase === "idle"}
                />
                <ProgressSteps
                  active={loading}
                  step1Complete={step1Complete}
                  elapsedLabel={`Analyzing for ${formatElapsed(elapsedMs)}…`}
                />
              </div>

              {queryPhase === "result" && result ? (
                <div
                  className={
                    "relative mt-8 space-y-8 transition-opacity duration-300 " +
                    (relatedLoading ? "opacity-50" : "opacity-100")
                  }
                >
                  {relatedLoading ? (
                    <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
                      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white/95 px-4 py-3 text-sm font-medium text-neutral-800 shadow-lg">
                        <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Updating simulation…
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <blockquote className="max-w-3xl border-l-4 border-primary/30 pl-4 text-sm italic text-neutral-700">
                      {queryText}
                    </blockquote>
                    <button
                      type="button"
                      onClick={onNewQuery}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-black/[0.03]"
                    >
                      New Query
                    </button>
                  </div>

                  <section>
                    <h3 className="font-heading text-base font-semibold text-black">
                      Rufus response
                    </h3>
                    <div className="mt-3">
                      <RufusResponseCard
                        queryType={result.queryType}
                        body={result.simulatedResponse}
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="font-heading text-base font-semibold text-black">
                      What Rufus weighted in this response
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Optimize these factors to appear in more Rufus answers
                    </p>
                    <div className="mt-4">
                      <RankingFactors factors={result.responseFactors} />
                    </div>
                  </section>

                  <section>
                    <h3 className="font-heading text-base font-semibold text-black">
                      Products Rufus would likely recommend
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      These products are well-positioned for this query
                    </p>
                    <div className="mt-4">
                      <CompetitorGrid items={result.competitorProducts} />
                    </div>
                  </section>

                  <section>
                    <h3 className="font-heading text-base font-semibold text-black">
                      Your Listing&apos;s Rufus Score
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      How well your listing is optimized for this query
                    </p>
                    <div className="mt-4">
                      <ListingScoreCard
                        score={result.listingScore}
                        onAddListing={scrollToQuery}
                      />
                    </div>
                  </section>

                  <section>
                    <h3 className="font-heading text-base font-semibold text-black">
                      Shoppers also ask Rufus
                    </h3>
                    <div className="mt-3">
                      <RelatedQuestions
                        questions={result.relatedQuestions}
                        disabled={relatedLoading}
                        onSelect={onRelatedSelect}
                      />
                    </div>
                  </section>

                  <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void onSave()}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-black/[0.03]"
                    >
                      {savedForId === queryId ? "✓ Saved" : "Save Query"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onCopy()}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-black/[0.03]"
                    >
                      {copyLabel ?? "Copy Response"}
                    </button>
                    <button
                      type="button"
                      onClick={onRunAgain}
                      disabled={loading || relatedLoading || historyReadOnly}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-black/[0.03] disabled:opacity-50"
                    >
                      Run Again
                    </button>
                  </div>
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
