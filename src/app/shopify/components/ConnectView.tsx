"use client";

import { useCallback, useState } from "react";

const SHOPIFY_GREEN = "#96BF48";

type ConnectViewProps = {
 initialShop?: string;
 onShopRemember?: (shop: string) => void;
};

export function ConnectView({ initialShop = "", onShopRemember }: ConnectViewProps) {
 const [shop, setShop] = useState(initialShop);
 const [touched, setTouched] = useState(false);
 const [busy, setBusy] = useState(false);

 const trimmed = shop.trim().toLowerCase();
 const invalid = touched && trimmed.length > 0 && !trimmed.endsWith(".myshopify.com");

 const connect = useCallback(() => {
 setTouched(true);
 if (!trimmed.endsWith(".myshopify.com")) {
 return;
 }
 setBusy(true);
 onShopRemember?.(trimmed);
 window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(trimmed)}`;
 }, [trimmed, onShopRemember]);

 const inputClass =
 "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

 return (
 <div className="max-w-[480px]">
 <div className="rounded-xl border border-border/80 bg-card/95 p-6 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <div className="flex flex-col items-start text-left">
 <span
 className="rounded-lg px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-black/15 dark:ring-white/15"
 style={{ backgroundColor: SHOPIFY_GREEN }}
 >
 Shopify
 </span>
 <h2 className="font-heading mt-4 text-lg font-semibold text-foreground">
 Connect your store
 </h2>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Enter your Shopify store URL to get started. You&apos;ll be redirected to Shopify
 to approve the connection.
 </p>
 </div>

 <label className="mt-6 block text-sm font-medium text-foreground/90">
 Your Shopify store URL
 <input
 type="text"
 value={shop}
 onChange={(e) => setShop(e.target.value)}
 onBlur={() => setTouched(true)}
 placeholder="mystore.myshopify.com"
 className={
 inputClass +
 (invalid
 ? " border-red-300 focus-visible:outline-red-300/50 dark:border-red-500/50 dark:focus-visible:outline-red-500/40"
 : "")
 }
 />
 </label>
 <p className="mt-1 text-xs text-muted-foreground">
 Enter just your store subdomain, e.g. mystore.myshopify.com
 </p>
 {invalid ? (
 <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
 Store URL must end with .myshopify.com
 </p>
 ) : null}

 <button
 type="button"
 disabled={busy}
 onClick={() => void connect()}
 className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/15"
 >
 Connect to Shopify →
 </button>
 </div>

 <p className="mt-6 text-left text-xs leading-relaxed text-muted-foreground">
 Your store data is never stored without your permission. We only request access to
 read and update product images.
 </p>

 <div className="mt-8 flex flex-wrap items-center justify-start gap-2">
 {[
 " Auto-generate lifestyle photos",
 " One-click publish to listing",
 " 4 photo variations per product",
 ].map((t) => (
 <span
 key={t}
 className="rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/40 dark:ring-white/[0.06]"
 >
 {t}
 </span>
 ))}
 </div>
 </div>
 );
}
