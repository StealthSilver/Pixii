"use client";

import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export type ListingFormState = {
  title: string;
  bulletsText: string;
  description: string;
  category: string;
  asin: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

type ListingInputPanelProps = {
  open: boolean;
  onToggle: () => void;
  value: ListingFormState;
  onChange: (next: ListingFormState) => void;
  disabled?: boolean;
};

export function ListingInputPanel({
  open,
  onToggle,
  value,
  onChange,
  disabled,
}: ListingInputPanelProps) {
  return (
    <div className="mt-4 border-t border-border/55 pt-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-50"
      >
        <span>Add your listing for a personalized score</span>
        {open ? (
          <FaChevronUp className="size-4 text-muted-foreground" aria-hidden />
        ) : (
          <FaChevronDown className="size-4 text-muted-foreground" aria-hidden />
        )}
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: open ? "2000px" : "0px" }}
      >
        <div className="mt-3 space-y-4 rounded-xl border border-border/70 bg-muted/35 p-4 ring-1 ring-black/[0.02] dark:bg-muted/20 dark:ring-white/[0.04]">
          <label className="block text-sm font-medium text-foreground/90">
            Product title
            <input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              disabled={disabled}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-foreground/90">
            Bullet points
            <textarea
              value={value.bulletsText}
              onChange={(e) =>
                onChange({ ...value, bulletsText: e.target.value })
              }
              disabled={disabled}
              rows={4}
              placeholder="Paste your bullet points here, one per line"
              className={`${fieldClass} resize-y`}
            />
          </label>
          <label className="block text-sm font-medium text-foreground/90">
            Product description
            <textarea
              value={value.description}
              onChange={(e) =>
                onChange({ ...value, description: e.target.value })
              }
              disabled={disabled}
              rows={3}
              className={`${fieldClass} resize-y`}
            />
          </label>
          <label className="block text-sm font-medium text-foreground/90">
            Product category
            <input
              value={value.category}
              onChange={(e) =>
                onChange({ ...value, category: e.target.value })
              }
              disabled={disabled}
              placeholder="e.g. Vitamins & Supplements"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-foreground/90">
            ASIN{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
            <input
              value={value.asin}
              onChange={(e) => onChange({ ...value, asin: e.target.value })}
              disabled={disabled}
              className={fieldClass}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
