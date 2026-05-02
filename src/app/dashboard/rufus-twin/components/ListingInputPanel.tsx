"use client";

import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export type ListingFormState = {
  title: string;
  bulletsText: string;
  description: string;
  category: string;
  asin: string;
};

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
    <div className="mt-4 border-t border-neutral-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-sm font-semibold text-neutral-800 transition-colors hover:bg-black/[0.02] disabled:opacity-50"
      >
        <span>Add your listing for a personalized score</span>
        {open ? (
          <FaChevronUp className="size-4 text-neutral-500" aria-hidden />
        ) : (
          <FaChevronDown className="size-4 text-neutral-500" aria-hidden />
        )}
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: open ? "2000px" : "0px" }}
      >
        <div className="mt-3 space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
          <label className="block text-sm font-medium text-neutral-700">
            Product Title
            <input
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              disabled={disabled}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Bullet Points
            <textarea
              value={value.bulletsText}
              onChange={(e) =>
                onChange({ ...value, bulletsText: e.target.value })
              }
              disabled={disabled}
              rows={4}
              placeholder="Paste your bullet points here, one per line"
              className="mt-1.5 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Product Description
            <textarea
              value={value.description}
              onChange={(e) =>
                onChange({ ...value, description: e.target.value })
              }
              disabled={disabled}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Product Category
            <input
              value={value.category}
              onChange={(e) =>
                onChange({ ...value, category: e.target.value })
              }
              disabled={disabled}
              placeholder="e.g. Vitamins & Supplements"
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            ASIN{" "}
            <span className="font-normal text-neutral-500">(optional)</span>
            <input
              value={value.asin}
              onChange={(e) => onChange({ ...value, asin: e.target.value })}
              disabled={disabled}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
