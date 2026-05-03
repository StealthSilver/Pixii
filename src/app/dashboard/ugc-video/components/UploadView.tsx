"use client";

import Image from "next/image";

const ACCEPT = "image/jpeg,image/png,image/webp";

type UploadViewProps = {
  productName: string;
  onProductNameChange: (v: string) => void;
  previewUrl: string | null;
  uploading: boolean;
  onFile: (file: File | null) => void;
};

export function UploadView({
  productName,
  onProductNameChange,
  previewUrl,
  uploading,
  onFile,
}: UploadViewProps) {
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files?.[0];
      if (f) {
        onFile(f);
      }
    },
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
          🎬 30-sec video
        </span>
        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900">
          🎙 Real voiceover
        </span>
        <span className="inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-900">
          📱 TikTok ready
        </span>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-black">
          Upload product photo
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Drop a clear photo of your product. We analyze it to write your script
          and visuals.
        </p>

        <div
          {...dropHandlers}
          className="mt-5 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center transition-colors hover:border-neutral-300"
        >
          <label className="cursor-pointer text-sm font-semibold text-primary">
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onFile(f);
                e.target.value = "";
              }}
            />
            Choose image
          </label>
          <p className="mt-2 text-xs text-neutral-500">
            or drag and drop · JPEG, PNG, WebP · max 10MB
          </p>
        </div>

        {previewUrl && (
          <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
            <div className="relative mx-auto aspect-square max-h-72 w-full max-w-sm">
              <Image
                src={previewUrl}
                alt="Product preview"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          </div>
        )}

        <label className="mt-5 block text-sm font-medium text-neutral-700">
          Product Name (optional)
          <input
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder="e.g. Magnesium Glycinate 400mg"
            className={inputClass}
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          We&apos;ll detect this from your photo if left blank
        </p>
      </section>
    </div>
  );
}
