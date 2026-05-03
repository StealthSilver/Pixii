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
 "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

 return (
 <div className="space-y-6">
 <div className="flex flex-wrap gap-2">
 <span className="inline-flex items-center rounded-full border border-sky-200/90 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-950 dark:border-sky-500/35 dark:bg-sky-950/40 dark:text-sky-100">
 30-sec video
 </span>
 <span className="inline-flex items-center rounded-full border border-violet-200/90 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
 Real voiceover
 </span>
 <span className="inline-flex items-center rounded-full border border-pink-200/90 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-950 dark:border-pink-500/35 dark:bg-pink-950/40 dark:text-pink-100">
 TikTok ready
 </span>
 </div>

 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Upload product photo
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Drop a clear photo of your product. We analyze it to write your script
 and visuals.
 </p>

 <div
 {...dropHandlers}
 className="mt-5 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 px-4 py-8 text-center transition-colors hover:border-muted-foreground/35 dark:bg-muted/30"
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
 <p className="mt-2 text-xs text-muted-foreground">
 or drag and drop · JPEG, PNG, WebP · max 10MB
 </p>
 </div>

 {previewUrl && (
 <div className="mt-5 overflow-hidden rounded-lg border border-border bg-muted/60 dark:bg-muted/40">
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

 <label className="mt-5 block text-sm font-medium text-foreground/90">
 Product Name (optional)
 <input
 type="text"
 value={productName}
 onChange={(e) => onProductNameChange(e.target.value)}
 placeholder="e.g. Magnesium Glycinate 400mg"
 className={inputClass}
 />
 </label>
 <p className="mt-1 text-xs text-muted-foreground">
 We&apos;ll detect this from your photo if left blank
 </p>
 </section>
 </div>
 );
}
