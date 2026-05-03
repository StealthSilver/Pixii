"use client";

import type { IconType } from "react-icons";
import { FaCommentDots, FaLink, FaPen, FaStar } from "react-icons/fa";

function pickIcon(text: string): IconType {
 const t = text.toLowerCase();
 if (
 t.includes("review") ||
 t.includes("rating") ||
 t.includes("trustpilot") ||
 t.includes("amazon review")
 ) {
 return FaStar;
 }
 if (
 t.includes("pr ") ||
 t.includes("press") ||
 t.includes("link") ||
 t.includes("backlink") ||
 t.includes("outreach")
 ) {
 return FaLink;
 }
 if (
 t.includes("position") ||
 t.includes("message") ||
 t.includes("voice") ||
 t.includes("tone")
 ) {
 return FaCommentDots;
 }
 return FaPen;
}

type RecommendationsProps = {
 items: string[];
};

export function Recommendations({ items }: RecommendationsProps) {
 const four = items.slice(0, 4);
 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Recommendations
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Four focused moves to improve how models talk about your brand.
 </p>
 <div className="mt-4 grid gap-3 sm:grid-cols-2">
 {four.map((text, i) => {
 const Icon = pickIcon(text);
 return (
 <article
 key={i}
 className="flex gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
 >
 <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
 {i + 1}
 </span>
 <div className="min-w-0">
 <p className="text-muted-foreground" aria-hidden>
 <Icon className="size-5 text-primary/90" />
 </p>
 <p className="mt-2 text-sm leading-relaxed text-foreground">
 {text}
 </p>
 </div>
 </article>
 );
 })}
 </div>
 </section>
 );
}
