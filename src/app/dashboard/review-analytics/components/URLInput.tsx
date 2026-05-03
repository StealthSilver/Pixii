"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { extractAsin } from "@/lib/aiCreator/extractAsin";

const EXAMPLE_URLS = [
 {
 label: " Example: Electronics",
 url: "https://www.amazon.com/dp/B09B8RVKJF",
 },
 {
 label: " Example: Fitness",
 url: "https://www.amazon.com/dp/B07Y3B4HJK",
 },
 {
 label: " Example: Beauty",
 url: "https://www.amazon.com/dp/B08XCVT8CZ",
 },
] as const;
/* Example ASINs; Claude fallback generates representative data if ScraperAPI is not set. */

type ValidationState =
 | { kind: "empty" }
 | { kind: "no_amazon" }
 | { kind: "no_asin" }
 | { kind: "valid"; asin: string };

type URLInputProps = {
 value: string;
 onChange: (v: string) => void;
 disabled?: boolean;
};

const inputClass =
 "mt-1.5 h-13 min-h-[52px] w-full rounded-lg border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

export function URLInput({ value, onChange, disabled }: URLInputProps) {
 const [debounced, setDebounced] = useState(value);

 useEffect(() => {
 const t = window.setTimeout(() => setDebounced(value), 400);
 return () => window.clearTimeout(t);
 }, [value]);

 const validation: ValidationState = useMemo(() => {
 const v = debounced.trim();
 if (!v) {
 return { kind: "empty" };
 }
 if (!v.toLowerCase().includes("amazon")) {
 return { kind: "no_amazon" };
 }
 const asin = extractAsin(v);
 if (!asin) {
 return { kind: "no_asin" };
 }
 return { kind: "valid", asin };
 }, [debounced]);

 const onChip = useCallback(
 (url: string) => {
 onChange(url);
 },
 [onChange],
 );

 return (
 <section
 className="rounded-xl border border-border bg-card p-5 shadow-sm"
 aria-labelledby="ra-url-heading"
 >
 <h2
 id="ra-url-heading"
 className="font-heading text-lg font-semibold text-foreground"
 >
 Your Amazon Product Listing URL
 </h2>
 <label className="mt-4 block text-sm font-medium text-foreground/90">
 Paste your product page link
 <input
 type="url"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 disabled={disabled}
 placeholder="https://www.amazon.com/dp/B08XXXXXXXX"
 className={inputClass}
 />
 </label>

 {validation.kind === "valid" ? (
 <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700">
 <FaCheck className="size-3.5 shrink-0" aria-hidden />
 ASIN detected: {validation.asin}
 </p>
 ) : null}
 {validation.kind === "no_asin" ? (
 <p className="mt-2 text-sm text-amber-800">
 Could not find a product ASIN. Make sure this is a direct product listing
 URL, not a search or category page.
 </p>
 ) : null}
 {validation.kind === "no_amazon" ? (
 <p className="mt-2 text-sm text-red-700">
 Please enter an Amazon product listing URL
 </p>
 ) : null}

 <div className="mt-4 flex flex-wrap gap-2">
 {EXAMPLE_URLS.map((c) => (
 <button
 key={c.url}
 type="button"
 disabled={disabled}
 onClick={() => onChip(c.url)}
 className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-card disabled:opacity-60"
 >
 {c.label}
 </button>
 ))}
 </div>
 </section>
 );
}

export function useDebouncedAmazonProductUrlValid(value: string): boolean {
 const [debounced, setDebounced] = useState(value);
 useEffect(() => {
 const t = window.setTimeout(() => setDebounced(value), 400);
 return () => window.clearTimeout(t);
 }, [value]);
 const v = debounced.trim();
 return v.length > 0 && v.toLowerCase().includes("amazon") && Boolean(extractAsin(v));
}
