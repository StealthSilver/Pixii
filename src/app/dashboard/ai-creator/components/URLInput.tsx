"use client";

import { extractAsin } from "@/lib/aiCreator/extractAsin";

type URLInputProps = {
 value: string;
 onChange: (v: string) => void;
};

export function URLInput({ value, onChange }: URLInputProps) {
 const lower = value.toLowerCase();
 const hasAmazon = lower.includes("amazon.") || lower.includes("amzn.");
 const asin = extractAsin(value);
 const isShort = lower.includes("amzn.to");

 let hint: { tone: "ok" | "warn" | "err" | "short"; text: string } | null =
 null;
 if (value.trim().length > 8) {
 if (isShort) {
 hint = {
 tone: "short",
 text: "Short links may not work for scraping. Prefer the full Amazon product URL from your browser.",
 };
 } else if (hasAmazon && asin) {
 hint = { tone: "ok", text: `ASIN: ${asin}` };
 } else if (hasAmazon && !asin) {
 hint = {
 tone: "warn",
 text: "Could not extract ASIN from this URL. Make sure it's a product listing page.",
 };
 } else if (!hasAmazon) {
 hint = {
 tone: "err",
 text: "Please enter an Amazon product listing URL.",
 };
 }
 }

 const hintCls =
 hint?.tone === "ok"
 ? "text-emerald-700 dark:text-emerald-400"
 : hint?.tone === "warn"
 ? "text-amber-800 dark:text-amber-200"
 : hint?.tone === "short"
 ? "text-amber-800 dark:text-amber-200"
 : hint?.tone === "err"
 ? "text-red-700 dark:text-red-300"
 : "";

 return (
 <div>
 <label
 htmlFor="amazon-url"
 className="text-sm font-semibold text-foreground"
 >
 Amazon Listing URL
 </label>
 <input
 id="amazon-url"
 type="url"
 autoComplete="off"
 placeholder="https://www.amazon.com/dp/B08XXXXX..."
 className="mt-2 h-11 min-h-[44px] w-full rounded-lg border border-border bg-card px-4 text-base text-foreground shadow-sm ring-1 ring-black/[0.04] outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/75 focus:border-primary/35 focus:ring-4 focus:ring-primary/10 dark:ring-white/[0.06] sm:h-[52px] sm:min-h-0 sm:text-sm"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 />
 {hint ? (
 <p className={`mt-2 flex items-center gap-1.5 text-xs ${hintCls}`}>
 {hint.tone === "ok" ? (
 <span aria-hidden></span>
 ) : hint.tone === "err" ? (
 <span aria-hidden></span>
 ) : (
 <span aria-hidden></span>
 )}
 {hint.text}
 </p>
 ) : null}

 <div className="mt-4 flex flex-wrap gap-2">
 <span className="text-xs text-muted-foreground">Examples (demo ASINs — AI fallback if scrape unavailable):</span>
 </div>
 <div className="mt-2 flex flex-wrap justify-start gap-2">
 {[
 {
 label: "Example: Supplement listing",
 url: "https://www.amazon.com/dp/B08EXAMP01",
 },
 {
 label: "Example: Electronics listing",
 url: "https://www.amazon.com/dp/B08EXAMP02",
 },
 {
 label: "Example: Beauty listing",
 url: "https://www.amazon.com/dp/B08EXAMP03",
 },
 ].map((chip) => (
 <button
 key={chip.url}
 type="button"
 onClick={() => onChange(chip.url)}
 className="min-h-11 rounded-full border border-border/80 bg-card/80 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-[1px] transition-colors hover:border-muted-foreground/30 hover:text-foreground sm:min-h-0 sm:py-1.5"
 >
 {chip.label}
 </button>
 ))}
 </div>
 </div>
 );
}
