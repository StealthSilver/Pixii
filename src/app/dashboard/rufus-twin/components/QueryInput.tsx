"use client";

import type { ListingFormState } from "./ListingInputPanel";
import { ListingInputPanel } from "./ListingInputPanel";

const EXAMPLES = [
  "best magnesium supplement for seniors",
  "magnesium glycinate vs magnesium citrate",
  "what helps with sleep naturally",
  "best protein powder for women over 40",
  "is creatine safe for beginners",
  "best collagen for skin and joints",
  "what vitamins should I take daily",
  "best pre workout without jitters",
] as const;

const inputClass =
  "mt-1.5 min-h-[56px] w-full resize-y rounded-lg border border-border px-3 py-3 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

const examplePillClass =
  "rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-[1px] transition-colors hover:border-muted-foreground/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 disabled:opacity-50";

const primaryBtn =
  "mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

type QueryInputProps = {
  queryText: string;
  onQueryChange: (v: string) => void;
  inputReadOnly?: boolean;
  listingDisabled?: boolean;
  listingOpen: boolean;
  onListingToggle: () => void;
  listing: ListingFormState;
  onListingChange: (next: ListingFormState) => void;
  onSubmit: () => void;
  disabled: boolean;
  showSubmit: boolean;
};

export function QueryInput({
  queryText,
  onQueryChange,
  inputReadOnly,
  listingDisabled,
  listingOpen,
  onListingToggle,
  listing,
  onListingChange,
  onSubmit,
  disabled,
  showSubmit,
}: QueryInputProps) {
  return (
    <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
      <label className="block text-sm font-medium text-foreground/90">
        Your question
        <textarea
          value={queryText}
          onChange={(e) => onQueryChange(e.target.value)}
          readOnly={Boolean(inputReadOnly)}
          disabled={disabled}
          placeholder='Ask what a shopper would ask Rufus... e.g. "best magnesium for seniors"'
          rows={2}
          className={
            inputClass +
            " " +
            (inputReadOnly
              ? "cursor-default bg-muted text-foreground"
              : "bg-card")
          }
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled || Boolean(inputReadOnly)}
            onClick={() => onQueryChange(q)}
            className={examplePillClass}
          >
            {q}
          </button>
        ))}
      </div>

      <ListingInputPanel
        open={listingOpen}
        onToggle={onListingToggle}
        value={listing}
        onChange={onListingChange}
        disabled={Boolean(listingDisabled)}
      />

      {showSubmit ? (
        <button
          type="button"
          disabled={disabled || !queryText.trim()}
          onClick={onSubmit}
          className={primaryBtn}
        >
          Simulate Rufus response →
        </button>
      ) : null}
    </section>
  );
}
