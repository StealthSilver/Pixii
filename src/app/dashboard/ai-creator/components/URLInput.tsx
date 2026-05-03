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
      ? "text-emerald-700"
      : hint?.tone === "warn"
        ? "text-amber-800"
        : hint?.tone === "short"
          ? "text-amber-800"
          : hint?.tone === "err"
            ? "text-red-700"
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
        className="mt-2 h-[52px] w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground shadow-sm outline-none ring-primary/0 transition-[box-shadow,border-color] placeholder:text-muted-foreground/75 focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? (
        <p className={`mt-2 flex items-center gap-1.5 text-xs ${hintCls}`}>
          {hint.tone === "ok" ? (
            <span aria-hidden>✓</span>
          ) : hint.tone === "err" ? (
            <span aria-hidden>✕</span>
          ) : (
            <span aria-hidden>⚠</span>
          )}
          {hint.text}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Examples (demo ASINs — AI fallback if scrape unavailable):</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
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
            className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors hover:border-primary/25 hover:bg-card"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
