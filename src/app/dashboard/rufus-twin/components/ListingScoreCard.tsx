"use client";

import type { ListingScore } from "@/lib/rufusTwin/types";
import { getScoreColor, scoreGradeLetter } from "@/lib/rufusTwin/scoreColor";

type ListingScoreCardProps = {
 score: ListingScore | null;
 onAddListing: () => void;
};

function BarRow({
 label,
 value,
}: {
 label: string;
 value: number;
}) {
 const colors = getScoreColor(value);
 return (
 <div className="flex items-center gap-3">
 <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
 {label}
 </span>
 <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
 <div
 className={`absolute left-0 top-0 h-full rounded-full ${colors.bar}`}
 style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
 />
 </div>
 <span
 className={`w-10 shrink-0 text-right text-xs font-semibold ${colors.text}`}
 >
 {Math.round(value)}
 </span>
 </div>
 );
}

function XIcon() {
 return (
 <svg
 className="mt-0.5 size-4 shrink-0 text-red-600"
 viewBox="0 0 16 16"
 fill="none"
 aria-hidden
 >
 <path
 d="M4 4l8 8M12 4l-8 8"
 stroke="currentColor"
 strokeWidth="1.8"
 strokeLinecap="round"
 />
 </svg>
 );
}

function CheckIcon() {
 return (
 <svg
 className="mt-0.5 size-4 shrink-0 text-emerald-600"
 viewBox="0 0 16 16"
 fill="none"
 aria-hidden
 >
 <path
 d="M3.5 8.5l3 3 6-7"
 stroke="currentColor"
 strokeWidth="1.8"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 );
}

export function ListingScoreCard({
 score,
 onAddListing,
}: ListingScoreCardProps) {
 if (!score) {
 return (
 <section className="rounded-xl border border-dashed border-border bg-card/80 p-6 text-center shadow-sm">
 <p className="text-sm font-medium text-foreground">
 Add your listing details to get a personalized Rufus visibility score
 </p>
 <button
 type="button"
 onClick={onAddListing}
 className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Add Listing
 </button>
 <p className="mt-2 text-xs text-muted-foreground">
 Expand &ldquo;Add your listing&rdquo; above, paste your content, then run
 the simulation again to score your listing.
 </p>
 </section>
 );
 }

 const overallColors = getScoreColor(score.overallScore);
 const grade = scoreGradeLetter(score.overallScore);

 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <div className="flex flex-col items-center border-b border-border/55 pb-5 text-center">
 <div
 className={`font-heading text-5xl font-bold tabular-nums ${overallColors.text}`}
 >
 {Math.round(score.overallScore)}
 </div>
 <div className="mt-1 flex items-center gap-2">
 <p className="text-sm font-medium text-muted-foreground">
 Rufus Visibility Score
 </p>
 <span
 className={`rounded-full border px-2 py-0.5 text-xs font-bold ${overallColors.pill}`}
 >
 {grade}
 </span>
 </div>
 {score.productTitle ? (
 <p className="mt-2 max-w-lg text-xs text-muted-foreground line-clamp-2">
 {score.productTitle}
 {score.asin ? ` · ${score.asin}` : ""}
 </p>
 ) : null}
 </div>
 <div className="mt-5 space-y-3">
 <BarRow label="Title" value={score.titleScore} />
 <BarRow label="Bullets" value={score.bulletScore} />
 <BarRow label="Description" value={score.descriptionScore} />
 <BarRow label="Reviews" value={score.reviewScore} />
 </div>
 <div className="mt-6 grid gap-4 md:grid-cols-2">
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 Gaps
 </h4>
 <ul className="mt-2 space-y-2">
 {score.gaps.map((g) => (
 <li key={g} className="flex gap-2 text-sm text-foreground/90">
 <XIcon />
 <span>{g}</span>
 </li>
 ))}
 </ul>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
 Improvements
 </h4>
 <ul className="mt-2 space-y-2">
 {score.improvements.map((g) => (
 <li key={g} className="flex gap-2 text-sm text-foreground/90">
 <CheckIcon />
 <span>{g}</span>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </section>
 );
}
