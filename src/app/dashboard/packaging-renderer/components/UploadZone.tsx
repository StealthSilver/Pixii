"use client";

import type { PackageShape } from "@/lib/models/packagingJobEnums";

type UploadZoneProps = {
  disabled?: boolean;
  file: File | null;
  error: string | null;
  onFile: (file: File | null) => void;
};

export function UploadZone({
  disabled,
  file,
  error,
  onFile,
}: UploadZoneProps) {
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files?.[0];
      if (f && f.type === "application/pdf") {
        onFile(f);
      }
    },
  };

  return (
    <div className="space-y-3">
      <div
        {...dropHandlers}
        className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-10 text-center transition-colors hover:border-neutral-300"
      >
        <svg
          className="mx-auto size-14 text-neutral-400"
          viewBox="0 0 56 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M4 8h36l12 12v44H4V8z"
            stroke="currentColor"
            strokeWidth="2"
            fill="white"
          />
          <path d="M40 8v12h12" stroke="currentColor" strokeWidth="2" />
          <text
            x="28"
            y="46"
            textAnchor="middle"
            fill="currentColor"
            fontSize="14"
            fontWeight="700"
          >
            PDF
          </text>
        </svg>
        <p className="mt-4 text-sm font-semibold text-black">
          Drop your dieline PDF here
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Supports single and multi-page PDFs up to 20MB
        </p>
        <label className="mt-5">
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              onFile(f ?? null);
              e.target.value = "";
            }}
          />
          <span className="inline-flex cursor-pointer rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60">
            Choose PDF
          </span>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm">
            <span className="max-w-[200px] truncate font-semibold text-neutral-800">
              {file.name}
            </span>
            <span className="text-xs text-neutral-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="rounded-md p-1 text-neutral-500 hover:bg-black/5 hover:text-black"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            We&apos;ll extract the artwork from page 1
          </p>
        </div>
      ) : null}
    </div>
  );
}

export const SHAPE_LABELS: Record<PackageShape, string> = {
  box_square: "Square box",
  box_rectangle: "Rectangle box",
  bottle_round: "Round bottle",
  bottle_square: "Square bottle",
  tube: "Tube",
  pouch: "Pouch",
  can: "Can",
  jar: "Jar",
};
