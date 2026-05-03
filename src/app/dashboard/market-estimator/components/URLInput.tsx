"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import {
 extractCategoryFromUrl,
 validateBestSellersUrl,
} from "@/lib/marketEstimator/amazonUrl";

const EXAMPLE_URLS = [
 {
 label: "Electronics Best Sellers",
 url: "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/",
 },
 {
 label: "Sports & Outdoors Best Sellers",
 url: "https://www.amazon.com/Best-Sellers-Sports-Outdoors/zgbs/sporting-goods/",
 },
 {
 label: "Beauty Best Sellers",
 url: "https://www.amazon.com/Best-Sellers-Beauty/zgbs/beauty/",
 },
] as const;
/* These use real Amazon URLs; if ScraperAPI is not set, the Claude fallback will generate representative data. */

type ValidationState =
 | { kind: "empty" }
 | { kind: "no_amazon" }
 | { kind: "not_bestsellers" }
 | { kind: "valid"; category: string };

type URLInputProps = {
 value: string;
 onChange: (v: string) => void;
 disabled?: boolean;
};

const inputClass =
 "mt-1.5 h-11 min-h-[44px] w-full rounded-lg border border-border bg-card px-3 py-3 text-base font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06] sm:h-13 sm:min-h-[52px] sm:text-sm";

const chipClass =
 "min-h-11 rounded-full border border-border/80 bg-card/80 px-3 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-[1px] transition-colors hover:border-muted-foreground/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 disabled:opacity-60 sm:min-h-0 sm:py-1.5";

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
 if (!validateBestSellersUrl(v)) {
 return { kind: "not_bestsellers" };
 }
 return { kind: "valid", category: extractCategoryFromUrl(v).category };
 }, [debounced]);

 const onChip = useCallback(
 (url: string) => {
 onChange(url);
 },
 [onChange],
 );

 return (
 <section
 className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05] sm:p-5"
 aria-labelledby="me-url-heading"
 >
 <h2
 id="me-url-heading"
 className="font-heading text-lg font-semibold tracking-tight text-foreground"
 >
 Best Sellers category URL
 </h2>
 <label className="mt-4 block text-sm font-medium text-foreground/90">
 Paste a category Best Sellers page
 <input
 type="url"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 disabled={disabled}
 placeholder="https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/"
 className={inputClass}
 />
 </label>

 {validation.kind === "valid" ? (
 <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
 <FaCheck className="size-3.5 shrink-0" aria-hidden />
 Category: {validation.category}
 </p>
 ) : null}
 {validation.kind === "not_bestsellers" ? (
 <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
 Use a Best Sellers category URL (not a product or search page).
 </p>
 ) : null}
 {validation.kind === "no_amazon" ? (
 <p className="mt-2 text-sm text-red-700 dark:text-red-300">Please enter an Amazon URL</p>
 ) : null}

 <div className="mt-4 flex flex-wrap justify-start gap-2">
 {EXAMPLE_URLS.map((c) => (
 <button
 key={c.url}
 type="button"
 disabled={disabled}
 onClick={() => onChip(c.url)}
 className={chipClass}
 >
 {c.label}
 </button>
 ))}
 </div>
 </section>
 );
}

export function useDebouncedUrlValid(value: string): boolean {
 const [debounced, setDebounced] = useState(value);
 useEffect(() => {
 const t = window.setTimeout(() => setDebounced(value), 400);
 return () => window.clearTimeout(t);
 }, [value]);
 const v = debounced.trim();
 return (
 v.length > 0 &&
 v.toLowerCase().includes("amazon") &&
 validateBestSellersUrl(v)
 );
}
