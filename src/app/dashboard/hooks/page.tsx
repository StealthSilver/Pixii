"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { FaBookOpen, FaSpinner } from "react-icons/fa";
import { GridBackdrop } from "@/components/GridBackdrop";
import { DraftsTab } from "./components/DraftsTab";
import { HookCard } from "./components/HookCard";
import { Toast } from "./components/Toast";
import type { WriteTabHandle } from "./components/WriteTab";
import { WriteTab } from "./components/WriteTab";
import type { DraftJson, HookPatternJson, TabId } from "./types";

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

const PLATFORMS_LIB = ["All", "Twitter", "TikTok", "Instagram", "LinkedIn"] as const;
const SORT_OPTIONS = [
  { value: "score", label: "Strength Score" },
  { value: "recent", label: "Most Recent" },
  { value: "used", label: "Most Used" },
] as const;

function segmentTabClass(active: boolean): string {
  return (
    "rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "bg-card text-foreground shadow-sm ring-1 ring-border/90 dark:bg-card dark:ring-border"
      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")
  );
}

function filterPillClass(active: boolean): string {
  return (
    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 " +
    (active
      ? "border-primary/35 bg-primary/10 text-primary ring-1 ring-primary/15"
      : "border-border/80 bg-card/80 text-muted-foreground backdrop-blur-[1px] hover:border-muted-foreground/30 hover:text-foreground")
  );
}

const secondaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

const primaryBtnClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

export default function HooksDashboardPage() {
  const [tab, setTab] = useState<TabId>("library");
  const [platformFilter, setPlatformFilter] =
    useState<(typeof PLATFORMS_LIB)[number]>("All");
  const [sortKey, setSortKey] =
    useState<(typeof SORT_OPTIONS)[number]["value"]>("score");
  const [selectedPattern, setSelectedPattern] =
    useState<HookPatternJson | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const writeRef = useRef<WriteTabHandle>(null);
  const { mutate: mutateKey } = useSWRConfig();

  const patternsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (platformFilter !== "All") {
      params.set("platform", platformFilter);
    }
    params.set("sort", sortKey);
    return `/api/hooks/patterns?${params.toString()}`;
  }, [platformFilter, sortKey]);

  const patternsPollMs =
    tab === "library" || tab === "write" ? 10_000 : 0;

  const {
    data: patternsData,
    error: patternsError,
    isLoading: patternsLoading,
    mutate: mutatePatterns,
  } = useSWR<{ patterns: HookPatternJson[] }>(patternsUrl, fetchJson, {
    refreshInterval: tab === "library" ? patternsPollMs : 0,
    revalidateOnFocus: tab === "library",
  });

  const { data: allPatternsData } = useSWR<{ patterns: HookPatternJson[] }>(
    "/api/hooks/patterns?sort=score",
    fetchJson,
    {
      refreshInterval: tab === "write" ? patternsPollMs : 0,
      revalidateOnFocus: tab === "write",
    },
  );

  const {
    data: draftsData,
    error: draftsError,
    isLoading: draftsLoading,
    mutate: mutateDrafts,
  } = useSWR<{ drafts: DraftJson[] }>("/api/hooks/drafts", fetchJson);

  const pushToast = useCallback(
    (message: string, variant: "success" | "error") => {
      setToast({ message, variant });
    },
    [],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/hooks/patterns/seed", { method: "POST" });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Seed failed");
      }
      setSelectedPattern(null);
      await mutatePatterns();
      await mutateKey(
        (key) => typeof key === "string" && key.startsWith("/api/hooks/patterns"),
      );
      pushToast("Demo patterns loaded", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Seed failed", "error");
    } finally {
      setSeeding(false);
    }
  };

  const useHookFromLibrary = (pattern: HookPatternJson) => {
    setSelectedPattern(pattern);
    setTab("write");
    window.requestAnimationFrame(() => {
      writeRef.current?.scrollToTop();
    });
  };

  const patterns = patternsData?.patterns ?? [];

  return (
    <>
      <div className="relative min-h-full overflow-x-hidden">
        <GridBackdrop />
        <div className="relative z-10 px-5 py-7 md:px-8 md:py-9">
          <header className="border-b border-border/70 pb-6">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Intelligence
            </p>
            <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Hooks
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Browse viral hook patterns, generate Pixii-native posts, and keep
              drafts in one minimal workspace.
            </p>
          </header>

          <div
            className="mt-8 inline-flex rounded-xl border border-border/60 bg-muted/35 p-1 dark:bg-muted/25"
            role="tablist"
            aria-label="Hooks sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "library"}
              className={segmentTabClass(tab === "library")}
              onClick={() => setTab("library")}
            >
              Library
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "write"}
              className={segmentTabClass(tab === "write")}
              onClick={() => setTab("write")}
            >
              Write
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "drafts"}
              className={segmentTabClass(tab === "drafts")}
              onClick={() => setTab("drafts")}
            >
              Drafts
            </button>
          </div>

          <div className="mt-8 max-w-6xl">
            {tab === "library" ? (
              <section aria-labelledby="hooks-library-heading">
                <h2 id="hooks-library-heading" className="sr-only">
                  Hook pattern library
                </h2>
                <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS_LIB.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatformFilter(p)}
                        className={filterPillClass(platformFilter === p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                      <span className="text-muted-foreground">Sort</span>
                      <select
                        value={sortKey}
                        onChange={(e) =>
                          setSortKey(
                            e.target.value as (typeof SORT_OPTIONS)[number]["value"],
                          )
                        }
                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]"
                      >
                        {SORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={seeding}
                      onClick={() => void handleSeed()}
                      className={secondaryBtnClass}
                    >
                      {seeding ? (
                        <FaSpinner className="size-4 animate-spin text-primary" aria-hidden />
                      ) : null}
                      Seed demo data
                    </button>
                  </div>
                </div>

                {patternsError ? (
                  <p className="mt-6 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200">
                    {patternsError.message}
                  </p>
                ) : null}

                {patternsLoading && !patterns.length ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="animate-pulse rounded-xl border border-border/80 bg-card/90 p-4 backdrop-blur-[1px]"
                      >
                        <div className="h-5 w-2/3 rounded bg-border" />
                        <div className="mt-3 h-3 w-full rounded bg-foreground/10" />
                        <div className="mt-2 h-3 w-5/6 rounded bg-foreground/10" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {!patternsLoading && !patterns.length && !patternsError ? (
                  <div className="mt-10 flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/70 px-6 py-10 text-center backdrop-blur-[1px]">
                    <FaBookOpen
                      className="size-11 text-muted-foreground/50"
                      aria-hidden
                    />
                    <p className="font-heading text-base font-semibold text-foreground">
                      No hook patterns yet
                    </p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      Seed demo data to load curated viral hook templates with
                      trends and examples.
                    </p>
                    <button
                      type="button"
                      disabled={seeding}
                      onClick={() => void handleSeed()}
                      className={`${primaryBtnClass} mt-1`}
                    >
                      {seeding ? (
                        <FaSpinner className="size-4 animate-spin" aria-hidden />
                      ) : null}
                      Seed demo data
                    </button>
                  </div>
                ) : null}

                {patterns.length ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {patterns.map((p) => (
                      <HookCard
                        key={p._id}
                        pattern={p}
                        onUseHook={useHookFromLibrary}
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {tab === "write" ? (
              <section aria-labelledby="hooks-write-heading">
                <h2 id="hooks-write-heading" className="sr-only">
                  Write with a hook pattern
                </h2>
                <WriteTab
                  ref={writeRef}
                  patterns={
                    allPatternsData?.patterns ?? patternsData?.patterns ?? []
                  }
                  selectedPattern={selectedPattern}
                  onSelectPattern={setSelectedPattern}
                  onToast={pushToast}
                  onDraftSaved={() => {
                    void mutateDrafts();
                    void mutatePatterns();
                    void mutateKey(
                      (key) =>
                        typeof key === "string" &&
                        key.startsWith("/api/hooks/patterns"),
                    );
                  }}
                />
              </section>
            ) : null}

            {tab === "drafts" ? (
              <section aria-labelledby="hooks-drafts-heading">
                <h2 id="hooks-drafts-heading" className="sr-only">
                  Saved drafts
                </h2>
                <DraftsTab
                  drafts={draftsData?.drafts}
                  loading={draftsLoading}
                  error={draftsError}
                  onRefresh={() => void mutateDrafts()}
                  onToast={pushToast}
                />
              </section>
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
