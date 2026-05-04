"use client";

import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { ListingImage } from "@/components/ListingImage";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { MarketJob } from "./types";

type ProductTableTabProps = {
 job: MarketJob;
};

function rankBadgeClass(rank: number): string {
 if (rank === 1) {
 return "bg-amber-100 text-amber-950 ring-1 ring-amber-300/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-500/30";
 }
 if (rank === 2) {
 return "bg-border text-foreground ring-1 ring-muted-foreground/40 dark:bg-muted/80";
 }
 if (rank === 3) {
 return "bg-orange-100 text-orange-950 ring-1 ring-orange-300/80 dark:bg-orange-950/45 dark:text-orange-100 dark:ring-orange-500/30";
 }
 return "bg-foreground/10 text-muted-foreground";
}

export function ProductTableTab({ job }: ProductTableTabProps) {
 const [minRev, setMinRev] = useState("");
 const [minRating, setMinRating] = useState("");

 const totalRev = useMemo(
 () =>
 job.products.reduce((s, p) => s + p.estimatedMonthlyRevenue, 0) || 1,
 [job.products],
 );

 const rows = useMemo(() => {
 const mr = parseFloat(minRev);
 const mrt = parseFloat(minRating);
 return job.products
 .filter((p) => {
 if (minRev.trim() && Number.isFinite(mr) && p.estimatedMonthlyRevenue < mr) {
 return false;
 }
 if (minRating.trim() && Number.isFinite(mrt) && p.rating < mrt) {
 return false;
 }
 return true;
 })
 .sort((a, b) => a.rank - b.rank);
 }, [job.products, minRev, minRating]);

 return (
 <div className="space-y-4">
 <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
 <label className="text-xs font-medium text-foreground/90">
 Min Revenue $
 <input
 type="number"
 value={minRev}
 onChange={(e) => setMinRev(e.target.value)}
 placeholder="0"
 className="mt-1 block h-11 w-full min-w-0 max-w-full rounded-lg border border-border bg-card px-2 py-2 text-base shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06] sm:h-auto sm:w-28 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-sm"
 />
 </label>
 <label className="text-xs font-medium text-foreground/90">
 Min Rating
 <input
 type="number"
 step="0.1"
 value={minRating}
 onChange={(e) => setMinRating(e.target.value)}
 placeholder="0"
 className="mt-1 block h-11 w-full min-w-0 max-w-full rounded-lg border border-border bg-card px-2 py-2 text-base shadow-sm ring-1 ring-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06] sm:h-auto sm:w-24 sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-sm"
 />
 </label>
 </div>

 <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <table className="min-w-[800px] w-full border-collapse text-left text-sm">
 <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:bg-muted/50">
 <tr>
 <th className="px-2 py-2 md:px-3 md:py-2">Rank</th>
 <th className="min-w-[280px] px-2 py-2 md:px-3 md:py-2">Product</th>
 <th className="px-2 py-2 md:px-3 md:py-2">Price</th>
 <th className="px-2 py-2 md:px-3 md:py-2">Rating</th>
 <th className="hidden px-2 py-2 md:table-cell md:px-3 md:py-2">Reviews</th>
 <th className="hidden px-2 py-2 md:table-cell md:px-3 md:py-2">Est. Monthly Sales</th>
 <th className="px-2 py-2 md:px-3 md:py-2">Est. Monthly Revenue</th>
 <th className="hidden px-2 py-2 md:px-3 md:py-2 lg:table-cell">Revenue Share</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {rows.map((p) => {
 const share = (p.estimatedMonthlyRevenue / totalRev) * 100;
 return (
 <tr key={p.asin + p.rank} className="align-top border-b border-border/50">
 <td className="whitespace-nowrap px-2 py-3 align-top md:px-3">
 <span
 className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${rankBadgeClass(p.rank)}`}
 >
 {p.rank}
 </span>
 </td>
 <td className="min-w-[280px] max-w-[400px] px-2 py-3 align-top md:px-3">
 <div className="flex items-start gap-3">
 <ListingImage src={p.imageUrl} alt="" squareSize={44} />
 <div className="min-w-0 flex-1">
 <p className="line-clamp-2 text-xs font-semibold leading-snug break-words text-foreground">
 {p.title}
 </p>
 <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug break-words text-foreground/90">
 {p.brand?.trim() ? p.brand : "—"}
 </p>
 </div>
 </div>
 </td>
 <td className="whitespace-nowrap px-2 py-3 align-top text-xs font-medium md:px-3">
 ${p.price.toFixed(2)}
 </td>
 <td className="whitespace-nowrap px-2 py-3 align-top text-xs md:px-3">
 <span className="inline-flex items-center gap-1 tabular-nums">
 {p.rating.toFixed(1)}
 <FaStar className="size-3 shrink-0 text-amber-500" aria-hidden />
 </span>
 </td>
 <td className="hidden whitespace-nowrap px-2 py-3 align-top text-xs md:table-cell md:px-3">
 {p.reviewCount.toLocaleString()}
 </td>
 <td className="hidden whitespace-nowrap px-2 py-3 align-top text-xs md:table-cell md:px-3">
 {p.estimatedMonthlySales.toLocaleString()}
 </td>
 <td className="whitespace-nowrap px-2 py-3 align-top text-xs font-semibold text-emerald-700 dark:text-emerald-400 md:px-3">
 {formatRevenue(p.estimatedMonthlyRevenue)}
 </td>
 <td className="hidden px-2 py-3 align-top md:px-3 lg:table-cell">
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/10">
 <div
 className="h-full rounded-full bg-primary/70"
 style={{ width: `${Math.min(100, share)}%` }}
 />
 </div>
 <span className="text-[11px] text-muted-foreground">
 {share.toFixed(1)}%
 </span>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 <p className="text-[11px] text-muted-foreground">
 * Revenue estimates are approximations based on Best Sellers Rank position.
 Actual revenues may vary significantly. Use as directional guidance only.
 </p>
 </div>
 );
}
