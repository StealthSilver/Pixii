"use client";

import Image from "next/image";
import { FaBox } from "react-icons/fa";

export type ShopifyProductRow = {
 id: number | string;
 title: string;
 images: { src?: string }[];
 product_type?: string | null;
 status: string;
};

type ProductListProps = {
 products: ShopifyProductRow[];
 loading: boolean;
 error: string | null;
 onRetry: () => void;
 selectedId: string | null;
 onSelect: (p: ShopifyProductRow) => void;
 search: string;
 onSearchChange: (v: string) => void;
};

const inputClass =
 "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

export function ProductList({
 products,
 loading,
 error,
 onRetry,
 selectedId,
 onSelect,
 search,
 onSearchChange,
}: ProductListProps) {
 const q = search.trim().toLowerCase();
 const filtered = q
 ? products.filter((p) => p.title.toLowerCase().includes(q))
 : products;

 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">Select a Product</h2>
 <label className="mt-4 block text-sm font-medium text-foreground/90">
 <span className="sr-only">Search products</span>
 <input
 type="search"
 value={search}
 onChange={(e) => onSearchChange(e.target.value)}
 placeholder="Search products..."
 className={inputClass}
 />
 </label>

 {error ? (
 <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
 <p>{error}</p>
 <button
 type="button"
 onClick={() => void onRetry()}
 className="mt-2 text-sm font-semibold text-red-900 underline"
 >
 Retry
 </button>
 </div>
 ) : null}

 <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto pr-1">
 {loading ? (
 <>
 {[0, 1, 2].map((i) => (
 <div key={i} className="h-16 animate-pulse rounded-lg bg-foreground/10" />
 ))}
 </>
 ) : !filtered.length ? (
 <p className="py-8 text-center text-sm text-muted-foreground">
 {products.length === 0
 ? "No active products found in your store"
 : "No products match your search."}
 </p>
 ) : (
 filtered.map((p) => {
 const id = String(p.id);
 const src = p.images?.[0]?.src;
 const selected = selectedId === id;
 return (
 <button
 key={id}
 type="button"
 onClick={() => onSelect(p)}
 className={
 "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors " +
 (selected
 ? "border-primary/50 bg-primary/5 shadow-sm"
 : "border-border bg-card hover:border-muted-foreground/35 hover:bg-muted/80")
 }
 >
 <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-foreground/10">
 {src ? (
 <Image src={src} alt="" fill sizes="40px" className="object-cover" />
 ) : (
 <span className="flex size-10 items-center justify-center text-muted-foreground/75">
 <FaBox className="size-4" aria-hidden />
 </span>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-bold text-foreground">{p.title}</p>
 {p.product_type ? (
 <span className="mt-0.5 inline-block rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
 {p.product_type}
 </span>
 ) : null}
 </div>
 </button>
 );
 })
 )}
 </div>
 </section>
 );
}
