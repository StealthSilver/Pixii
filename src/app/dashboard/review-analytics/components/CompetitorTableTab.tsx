"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { formatRevenue } from "@/lib/marketEstimator/formatRevenue";
import { formatNumber } from "@/lib/reviewAnalytics/formatNumber";
import type { ReviewListingRow } from "./types";

type SortKey =
 | "title"
 | "brand"
 | "price"
 | "rating"
 | "reviewCount"
 | "bsr"
 | "estimatedMonthlySales"
 | "estimatedMonthlyRevenue"
 | "avgSentimentScore";

type Props = {
 listings: ReviewListingRow[];
 userAsin: string;
};

function sentimentPillClass(n: number): string {
 if (n >= 70) {
 return "border border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/45 dark:text-emerald-100";
 }
 if (n >= 40) {
 return "border border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100";
 }
 return "border border-red-200/90 bg-red-50 text-red-950 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-100";
}

function formatBsr(n: number): string {
 if (!n || n >= 999999) {
 return "N/A";
 }
 return `#${n.toLocaleString()}`;
}

export function CompetitorTableTab({ listings, userAsin }: Props) {
 const [sortKey, setSortKey] = useState<SortKey>("estimatedMonthlyRevenue");
 const [dir, setDir] = useState<"asc" | "desc">("desc");

 const sorted = useMemo(() => {
 const base = [...listings];
 base.sort((a, b) => {
 let av: number | string = 0;
 let bv: number | string = 0;
 if (sortKey === "title" || sortKey === "brand") {
 av = String(a[sortKey] ?? "").toLowerCase();
 bv = String(b[sortKey] ?? "").toLowerCase();
 } else {
 av = Number(a[sortKey] ?? 0);
 bv = Number(b[sortKey] ?? 0);
 }
 if (typeof av === "string") {
 const c = av.localeCompare(String(bv));
 return dir === "asc" ? c : -c;
 }
 const c = (av as number) - (bv as number);
 return dir === "asc" ? c : -c;
 });
 return base;
 }, [listings, sortKey, dir]);

 const totalRev = listings.reduce((s, l) => s + (l.estimatedMonthlyRevenue || 0), 0);

 const toggle = (k: SortKey) => {
 if (sortKey === k) {
 setDir((d) => (d === "asc" ? "desc" : "asc"));
 } else {
 setSortKey(k);
 setDir(k === "title" || k === "brand" ? "asc" : "desc");
 }
 };

 const th = (k: SortKey, label: string, thClass = "") => (
 <th className={`whitespace-nowrap px-2 py-2 text-left ${thClass}`}>
 <button
 type="button"
 onClick={() => toggle(k)}
 className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
 >
 {label}
 {sortKey === k ? (dir === "asc" ? "↑" : "↓") : ""}
 </button>
 </th>
 );

 return (
 <div className="space-y-3">
 <p className="text-sm text-foreground/90">
 Showing {listings.length} listings · Total market est.{" "}
 <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatRevenue(totalRev)}</span>
 /mo
 </p>

 <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <table className="min-w-[960px] w-full border-collapse text-sm">
 <thead className="border-b border-border bg-muted/90 dark:bg-muted/50">
 <tr>
 <th className="px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
 #
 </th>
 {th("title", "Product")}
 {th("brand", "Brand")}
 {th("price", "Price")}
 {th("rating", "Rating")}
 {th("reviewCount", "Reviews")}
 {th("bsr", "BSR", "hidden lg:table-cell")}
 {th("estimatedMonthlySales", "Est. Sales", "hidden lg:table-cell")}
 {th("estimatedMonthlyRevenue", "Est. Revenue")}
 {th("avgSentimentScore", "Sentiment", "hidden lg:table-cell")}
 </tr>
 </thead>
 <tbody>
 {sorted.map((row, idx) => {
 const isYou = row.asin === userAsin;
 return (
 <tr
 key={row.asin}
 className={
 isYou
 ? "border-b border-primary/15 bg-primary/[0.06]"
 : "border-b border-border/55"
 }
 >
 <td className="px-2 py-2 font-medium text-foreground">
 {idx + 1}
 {isYou ? (
 <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
 ← You
 </span>
 ) : null}
 </td>
 <td className="max-w-[220px] px-2 py-2">
 <div className="flex gap-2">
 <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border/55 bg-muted">
 {row.imageUrl ? (
 <Image
 src={row.imageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 sizes="40px"
 />
 ) : null}
 </div>
 <p className="line-clamp-2 text-xs font-medium text-foreground">
 {row.title}
 </p>
 </div>
 </td>
 <td className="px-2 py-2 text-xs text-foreground/90">{row.brand}</td>
 <td className="px-2 py-2 font-medium">${row.price.toFixed(2)}</td>
 <td className="px-2 py-2">
 <span className="inline-flex items-center gap-1 text-xs font-semibold">
 {row.rating.toFixed(1)}
 <FaStar className="size-3 text-amber-500" aria-hidden />
 </span>
 </td>
 <td className="px-2 py-2 text-xs">{formatNumber(row.reviewCount)}</td>
 <td className="hidden px-2 py-2 text-xs text-foreground/90 lg:table-cell">{formatBsr(row.bsr)}</td>
 <td className="hidden px-2 py-2 text-xs lg:table-cell">{formatNumber(row.estimatedMonthlySales)}</td>
 <td
 className={
 "px-2 py-2 text-xs font-semibold " +
 (isYou ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-emerald-700 dark:text-emerald-400")
 }
 >
 {formatRevenue(row.estimatedMonthlyRevenue)}
 </td>
 <td className="hidden px-2 py-2 lg:table-cell">
 <span
 className={
 "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold " +
 sentimentPillClass(row.avgSentimentScore)
 }
 >
 {Math.round(row.avgSentimentScore)}/100
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 <p className="text-[11px] text-muted-foreground">
 * Revenue estimates based on Best Sellers Rank. Directional only. Your row is
 highlighted.
 </p>
 </div>
 );
}
