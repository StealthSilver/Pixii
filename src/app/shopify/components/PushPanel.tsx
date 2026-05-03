"use client";

import Image from "next/image";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";

const SHOPIFY_GREEN = "#96BF48";

type PushPanelProps = {
 jobId: string;
 productTitle: string;
 productId: string;
 shopDomain: string;
 shopName: string;
 selectedImageUrl: string | null;
 initialPushed: boolean;
 onPublished?: () => void;
 onToast: (message: string, variant: "success" | "error" | "info") => void;
 onGenerateMore: () => void;
};

export function PushPanel({
 jobId,
 productTitle,
 productId,
 shopDomain,
 shopName,
 selectedImageUrl,
 initialPushed,
 onPublished,
 onToast,
 onGenerateMore,
}: PushPanelProps) {
 const [publishing, setPublishing] = useState(false);
 const [done, setDone] = useState(initialPushed);

 const adminProductUrl = `https://${shopDomain}/admin/products/${productId}`;

 const onPush = async () => {
 if (!selectedImageUrl) {
 return;
 }
 setPublishing(true);
 try {
 const res = await fetch("/api/shopify/push", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ jobId, selectedImageUrl }),
 });
 const data = (await res.json()) as {
 success?: boolean;
 error?: string;
 };
 if (!data.success) {
 onToast(data.error ?? "Publish failed.", "error");
 return;
 }
 setDone(true);
 onToast("Published to your Shopify listing.", "success");
 onPublished?.();
 } catch (e) {
 onToast(e instanceof Error ? e.message : "Publish failed.", "error");
 } finally {
 setPublishing(false);
 }
 };

 if (done) {
 return (
 <div className="mt-8 rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-8 text-left shadow-sm ring-1 ring-black/[0.04] dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:ring-emerald-500/15">
 <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white ring-1 ring-black/15 dark:bg-emerald-600 dark:ring-white/15">
 <svg className="size-9" viewBox="0 0 24 24" fill="none" aria-hidden>
 <path
 d="M5 13l4 4L19 7"
 stroke="currentColor"
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 </div>
 <h3 className="font-heading mt-4 text-lg font-semibold text-foreground">Published to Shopify!</h3>
 <p className="mt-2 text-sm text-foreground/90">
 Your lifestyle photo has been added to{" "}
 <span className="font-semibold text-foreground">{productTitle}</span> on{" "}
 <span className="font-semibold text-foreground">{shopName}</span>.
 </p>
 <a
 href={adminProductUrl}
 target="_blank"
 rel="noreferrer"
 className="mt-4 block text-sm font-semibold text-primary underline-offset-2 hover:underline"
 >
 View on Shopify
 </a>
 <button
 type="button"
 onClick={() => onGenerateMore()}
 className="mt-6 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Generate More Photos
 </button>
 </div>
 );
 }

 return (
 <div className="mt-8 rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 {!selectedImageUrl ? (
 <p className="py-6 text-left text-sm text-muted-foreground">
 Select a photo above to publish it to your listing
 </p>
 ) : (
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
 <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/60 ring-1 ring-black/[0.04] dark:bg-muted/40 dark:ring-white/[0.06]">
 <Image
 src={selectedImageUrl}
 alt=""
 fill
 className="object-cover"
 unoptimized
 />
 </div>
 <div className="min-w-0 flex-1 text-left">
 <p className="font-heading text-sm font-semibold text-foreground">
 Ready to publish to {productTitle}
 </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
 This photo will be added as image #2 on your Shopify product listing. Your original
 photos won&apos;t be affected.
 </p>
 </div>
 </div>
 )}
 <button
 type="button"
 disabled={!selectedImageUrl || publishing}
 onClick={() => void onPush()}
 className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-black/20 transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:ring-white/20"
 style={{ backgroundColor: SHOPIFY_GREEN }}
 >
 {publishing ? (
 <>
 <FaSpinner className="size-4 animate-spin" aria-hidden />
 Publishing...
 </>
 ) : (
 <>Publish to Shopify Listing →</>
 )}
 </button>
 </div>
 );
}
