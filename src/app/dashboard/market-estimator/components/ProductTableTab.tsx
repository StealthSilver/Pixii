"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import type { MarketJob } from "./types";

type ProductTableTabProps = {
 job: MarketJob;
};

function rankBadgeClass(rank: number): string {
 if (rank === 1) {
 return "bg-amber-100 text-amber-900 ring-1 ring-amber-300";
 }
 if (rank === 2) {
 return "bg-border text-foreground ring-1 ring-muted-foreground/45";
 }
 if (rank === 3) {
 return "bg-orange-100 text-orange-900 ring-1 ring-orange-300";
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
 <div className="flex flex-wrap gap-3">
 <label className="text-xs font-medium text-foreground/90">
 Min Revenue $
 <input
 type="number"
 value={minRev}
 onChange={(e) => setMinRev(e.target.value)}
 placeholder="0"
 className="mt-1 block w-28 rounded-lg border border-border bg-card px-2 py-1.5 text-sm shadow-sm"
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
 className="mt-1 block w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-sm shadow-sm"
 />
 </label>
 </div>

 <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
 <table className="min-w-[720px] w-full text-left text-sm">
 <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 <tr>
 <th className="px-3 py-2">Rank</th>
 <th className="px-3 py-2">Product</th>
 <th className="px-3 py-2">Price</th>
 <th className="px-3 py-2">Rating</th>
 <th className="px-3 py-2">Reviews</th>
 <th className="px-3 py-2">Est. Monthly Sales</th>
 <th className="px-3 py-2">Est. Monthly Revenue</th>
 <th className="px-3 py-2">Revenue Share</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {rows.map((p) => {
 const share = (p.estimatedMonthlyRevenue / totalRev) * 100;
 return (
 <tr key={p.asin + p.rank} className="align-middle">
 <td className="px-3 py-2">
 <span
 className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${rankBadgeClass(p.rank)}`}
 >
 {p.rank}
 </span>
 </td>
 <td className="max-w-[220px] px-3 py-2">
 <div className="flex gap-2">
 <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border/55 bg-muted">
 {p.imageUrl ? (
 <Image
 src={p.imageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 sizes="40px"
 />
 ) : null}
 </div>
 <div className="min-w-0">
 <p className="line-clamp-2 text-xs font-semibold text-foreground">
 {p.title}
 </p>
 <p className="line-clamp-1 text-[11px] text-muted-foreground">
 {p.brand || "—"}
 </p>
 </div>
 </div>
 </td>
 <td className="whitespace-nowrap px-3 py-2 text-xs font-medium">
 ${p.price.toFixed(2)}
 </td>
 <td className="whitespace-nowrap px-3 py-2 text-xs">
 <span className="inline-flex items-center gap-1 tabular-nums">
 {p.rating.toFixed(1)}
 <FaStar className="size-3 shrink-0 text-amber-500" aria-hidden />
 </span>
 </td>
 <td className="whitespace-nowrap px-3 py-2 text-xs">
 {p.reviewCount.toLocaleString()}
 </td>
 <td className="whitespace-nowrap px-3 py-2 text-xs">
 {p.estimatedMonthlySales.toLocaleString()}
 </td>
 <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-emerald-700">
 {formatRevenue(p.estimatedMonthlyRevenue)}
 </td>
 <td className="px-3 py-2">
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
