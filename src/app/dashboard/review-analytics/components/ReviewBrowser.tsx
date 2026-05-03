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
 <div className="space-y-4 rounded-lg border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
 <label className="text-xs font-semibold text-foreground/90">
 ASIN
 <select
 value={asin}
 onChange={(e) => setAsin(e.target.value)}
 className="mt-1 block h-11 w-full min-w-0 rounded-lg border border-border bg-card px-2 py-2 text-base shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06] sm:h-auto sm:min-h-0 sm:py-1.5 sm:text-sm"
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
 <span className="inline-flex items-center gap-0.5 tabular-nums">
 {n}
 <FaStar className="size-3 text-amber-500" aria-hidden />
 </span>
 </label>
 ))}
 </div>
 </div>
 <button
 type="button"
 onClick={() => void load()}
 className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 dark:ring-white/15"
 >
 Apply
 </button>
 </div>

 {err ? <p className="text-sm text-red-700 dark:text-red-300">{err}</p> : null}
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
 className="w-full rounded-lg border border-border bg-card py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted dark:ring-white/[0.06]"
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
 <li className="rounded-lg border border-border/55 bg-muted/70 p-3 text-sm ring-1 ring-black/[0.02] dark:bg-muted/50 dark:ring-white/[0.04]">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
 {r.rating}
 <FaStar className="size-3" aria-hidden />
 </span>
 {r.verifiedPurchase ? (
 <span className="rounded border border-emerald-200/90 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/40 dark:text-emerald-100">
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
