"use client";

import { useState } from "react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export type RufusHistoryRow = {
 _id: string;
 queryText: string;
 queryType: string;
 category: string;
 overallScore: number | null;
 createdAt: string;
};

const TYPE_BADGE: Record<string, string> = {
 product_recommendation:
 "border-blue-200 bg-blue-50 text-blue-900",
 product_comparison:
 "border-purple-200 bg-purple-50 text-purple-900",
 use_case: "border-teal-200 bg-teal-50 text-teal-900",
 ingredient_question:
 "border-emerald-200 bg-emerald-50 text-emerald-900",
 concern_question:
 "border-amber-200 bg-amber-50 text-amber-900",
 brand_question: "border-rose-200 bg-rose-50 text-rose-900",
};

function scorePill(score: number | null): string {
 const base =
 "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ";
 if (score === null || score === undefined) {
 return base + "border-border bg-muted text-muted-foreground";
 }
 if (score >= 70) {
 return base + "border-emerald-200 bg-emerald-50 text-emerald-900";
 }
 if (score >= 40) {
 return base + "border-amber-200 bg-amber-50 text-amber-900";
 }
 return base + "border-red-200 bg-red-50 text-red-900";
}

type HistoryListProps = {
 items: RufusHistoryRow[] | undefined;
 loading: boolean;
 error: Error | undefined;
 onView: (id: string) => void;
 onDeleted: () => void;
 onToast: (message: string, variant: "success" | "error") => void;
 onAskRufus: () => void;
};

export function HistoryList({
 items,
 loading,
 error,
 onView,
 onDeleted,
 onToast,
 onAskRufus,
}: HistoryListProps) {
 const [confirmId, setConfirmId] = useState<string | null>(null);

 if (error) {
 return (
 <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
 {error.message}
 </p>
 );
 }

 if (loading && !items?.length) {
 return (
 <div className="space-y-3">
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 className="animate-pulse rounded-xl border border-border bg-card p-4"
 >
 <div className="h-4 w-2/3 rounded bg-border" />
 <div className="mt-3 h-3 w-1/3 rounded bg-foreground/10" />
 </div>
 ))}
 </div>
 );
 }

 if (!items?.length) {
 return (
 <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
 <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
 <svg
 viewBox="0 0 24 24"
 className="size-6"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 aria-hidden
 >
 <circle cx="11" cy="11" r="7" />
 <path d="M20 20l-3-3" strokeLinecap="round" />
 </svg>
 </div>
 <p className="mt-4 font-heading text-sm font-semibold text-foreground">
 No queries yet
 </p>
 <p className="mt-1 text-sm text-muted-foreground">
 Run your first Rufus simulation above
 </p>
 <button
 type="button"
 onClick={onAskRufus}
 className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Ask Rufus
 </button>
 </div>
 );
 }

 return (
 <ul className="space-y-3">
 {items.map((row) => {
 const typeClass =
 TYPE_BADGE[row.queryType] ??
 "border-border bg-muted text-foreground";
 return (
 <li
 key={row._id}
 className="rounded-xl border border-border bg-card p-4 shadow-sm"
 >
 <p className="line-clamp-2 font-heading text-sm font-semibold text-foreground">
 {row.queryText}
 </p>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <span
 className={
 "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
 typeClass
 }
 >
 {row.queryType.replace(/_/g, " ")}
 </span>
 {row.category ? (
 <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
 {row.category}
 </span>
 ) : null}
 {row.overallScore !== null ? (
 <span className={scorePill(row.overallScore)}>
 Score {row.overallScore}
 </span>
 ) : null}
 <span className="ml-auto text-xs text-muted-foreground">
 {formatRelativeTime(row.createdAt)}
 </span>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => onView(row._id)}
 className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 View
 </button>
 {confirmId === row._id ? (
 <span className="inline-flex items-center gap-2 text-xs text-foreground/90">
 Sure?
 <button
 type="button"
 className="rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-800"
 onClick={async () => {
 try {
 const res = await fetch(
 `/api/rufus-twin/history/${row._id}`,
 { method: "DELETE" },
 );
 if (!res.ok) {
 const b = (await res.json()) as { error?: string };
 throw new Error(b.error ?? "Delete failed");
 }
 onToast("Query deleted", "success");
 setConfirmId(null);
 onDeleted();
 } catch (e) {
 onToast(
 e instanceof Error ? e.message : "Delete failed",
 "error",
 );
 }
 }}
 >
 Yes
 </button>
 <button
 type="button"
 className="rounded-md border border-border bg-card px-2 py-1 font-semibold text-foreground"
 onClick={() => setConfirmId(null)}
 >
 Cancel
 </button>
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setConfirmId(row._id)}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-foreground/[0.06]"
 >
 Delete
 </button>
 )}
 </div>
 </li>
 );
 })}
 </ul>
 );
}
