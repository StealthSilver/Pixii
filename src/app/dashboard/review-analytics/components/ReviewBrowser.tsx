"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import type { ReviewListingRow } from "./types";

type ReviewRow = {
  asin: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  helpfulVotes: number;
  reviewDate?: string;
};

type Props = {
  jobId: string;
  listings: ReviewListingRow[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json()) as unknown;
  if (!res.ok) {
    const err =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(err);
  }
  return body as T;
}

export function ReviewBrowser({ jobId, listings }: Props) {
  const [asin, setAsin] = useState<string>("");
  const [ratings, setRatings] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });
  const [all, setAll] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(20);

  const ratingQuery = useMemo(() => {
    const on = Object.entries(ratings)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return on.length ? on.join(",") : "";
  }, [ratings]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (asin) {
        qs.set("asin", asin);
      }
      if (ratingQuery) {
        qs.set("rating", ratingQuery);
      }
      const q = qs.toString();
      const url = `/api/review-analytics/reviews/${jobId}${q ? `?${q}` : ""}`;
      const data = await fetchJson<{ reviews: ReviewRow[] }>(url);
      setAll(data.reviews ?? []);
      setVisible(20);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load reviews");
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, asin, ratingQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = all.slice(0, visible);

  const toggleRating = (n: number) => {
    setRatings((r) => ({ ...r, [n]: !r[n] }));
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-foreground/90">
          ASIN
          <select
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            className="mt-1 block rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
          >
            <option value="">All listings</option>
            {listings.map((l) => (
              <option key={l.asin} value={l.asin}>
                {l.asin}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-xs font-semibold text-foreground/90">Star rating</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={ratings[n] ?? false}
                  onChange={() => toggleRating(n)}
                />
                {n}★
              </label>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          Apply
        </button>
      </div>

      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <ul className="space-y-3">
        {shown.map((r, i) => (
          <ReviewCard key={`${r.asin}-${i}-${r.title}`} r={r} />
        ))}
      </ul>

      {visible < all.length ? (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 20)}
          className="w-full rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}

function ReviewCard({ r }: { r: ReviewRow }) {
  const [expanded, setExpanded] = useState(false);
  const body = r.body ?? "";
  const short = body.length > 220 ? `${body.slice(0, 220)}…` : body;
  return (
    <li className="rounded-lg border border-border/55 bg-muted/80 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
          {r.rating}
          <FaStar className="size-3" aria-hidden />
        </span>
        {r.verifiedPurchase ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
            Verified
          </span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : ""}
        </span>
      </div>
      <p className="mt-1 font-medium text-foreground">{r.title}</p>
      <p className="mt-1 text-xs text-foreground/90">{expanded ? body : short}</p>
      {body.length > 220 ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Expand"}
        </button>
      ) : null}
    </li>
  );
}
