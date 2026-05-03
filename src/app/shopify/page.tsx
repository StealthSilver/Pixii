"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { FeaturePage } from "@/components/FeaturePage";
import { Toast } from "@/app/dashboard/hooks/components/Toast";
import {
  SHOPIFY_PHOTO_LIFESTYLES,
  type ShopifyPhotoLifestyle,
} from "@/lib/shopify/lifestyleConstants";
import { ConnectView } from "./components/ConnectView";
import { ConnectionBar } from "./components/ConnectionBar";
import { ProductList, type ShopifyProductRow } from "./components/ProductList";
import { LifestyleSelector, LIFESTYLE_OPTIONS } from "./components/LifestyleSelector";
import { ProcessingView } from "./components/ProcessingView";
import { PhotoGrid } from "./components/PhotoGrid";
import { PushPanel } from "./components/PushPanel";
import { HistoryStrip, type HistoryStripItem } from "./components/HistoryStrip";

type View = "connect" | "products" | "processing" | "result";

type ConnectionPayload =
  | { connected: false }
  | {
      connected: true;
      shopDomain: string;
      shopName: string;
      shopEmail: string;
      planName: string;
      installedAt: string;
    };

type JobPayload = {
  _id: string;
  status: string;
  currentStep: number;
  productTitle: string;
  productId: string;
  productImageUrl: string;
  lifestyle: string;
  cloudinaryUrls: string[];
  errorMessage?: string;
  processingTimeMs?: number | null;
  pushedToShopify?: boolean;
};

const LS_LIFESTYLE = "pixii_shopify_selected_lifestyle";
const LS_SHOP_DOMAIN = "pixii_shopify_last_shop_domain";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let body: unknown = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

function readStoredLifestyle(): ShopifyPhotoLifestyle {
  if (typeof window === "undefined") {
    return "studio_white";
  }
  const v = window.localStorage.getItem(LS_LIFESTYLE);
  if (v && SHOPIFY_PHOTO_LIFESTYLES.includes(v as ShopifyPhotoLifestyle)) {
    return v as ShopifyPhotoLifestyle;
  }
  return "studio_white";
}

function ShopifyPhotosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("connect");
  const [connection, setConnection] = useState<ConnectionPayload | null>(null);
  const [connLoading, setConnLoading] = useState(true);

  const [products, setProducts] = useState<ShopifyProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<ShopifyProductRow | null>(null);
  const [lifestyle, setLifestyle] = useState<ShopifyPhotoLifestyle>("studio_white");
  const [productCategory, setProductCategory] = useState("");

  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobPayload | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const [initialShop, setInitialShop] = useState("");

  const { data: historyData, mutate: mutateHistory } = useSWR<{ items: HistoryStripItem[] }>(
    connection?.connected ? "/api/shopify/history" : null,
    fetchJson,
    { revalidateOnFocus: true },
  );

  const lifestyleLabel = useMemo(
    () => LIFESTYLE_OPTIONS.find((o) => o.id === lifestyle)?.label ?? lifestyle,
    [lifestyle],
  );

  const loadConnection = useCallback(async () => {
    setConnLoading(true);
    try {
      const data = await fetchJson<ConnectionPayload>("/api/shopify/connection");
      setConnection(data);
      if (data.connected) {
        setView("products");
        try {
          window.localStorage.setItem(LS_SHOP_DOMAIN, data.shopDomain);
        } catch {
          /* ignore */
        }
      } else {
        setView("connect");
        try {
          const last = window.localStorage.getItem(LS_SHOP_DOMAIN) ?? "";
          setInitialShop(last);
        } catch {
          setInitialShop("");
        }
      }
    } catch {
      setConnection({ connected: false });
      setView("connect");
      setToast({ message: "Could not load Shopify connection.", variant: "error" });
    } finally {
      setConnLoading(false);
    }
  }, []);

  useEffect(() => {
    setLifestyle(readStoredLifestyle());
    void loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "true") {
      setToast({ message: "Store connected successfully!", variant: "success" });
      router.replace("/shopify", { scroll: false });
      void loadConnection();
    }
  }, [searchParams, router, loadConnection]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    if (toast.variant === "error") {
      return;
    }
    const ms = toast.variant === "success" ? 3000 : 4000;
    const id = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(id);
  }, [toast]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await fetchJson<{ products: ShopifyProductRow[] }>("/api/shopify/products");
      setProducts(data.products ?? []);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : "Failed to load products.");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "products" && connection?.connected) {
      void loadProducts();
    }
  }, [view, connection, loadProducts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_LIFESTYLE, lifestyle);
    } catch {
      /* ignore */
    }
  }, [lifestyle]);

  useEffect(() => {
    if (view !== "processing" || !jobId) {
      return;
    }
    let cancelled = false;
    const started = Date.now();
    setPollStartedAt(started);
    setPollTimedOut(false);

    async function pollOnce() {
      try {
        const doc = await fetchJson<JobPayload>(`/api/shopify/status/${jobId}`);
        if (cancelled) {
          return;
        }
        setJob(doc);
        if (doc.status === "complete" || doc.status === "pushed") {
          setSelectedImageUrl(null);
          setView("result");
          void mutateHistory();
        }
      } catch {
        if (!cancelled) {
          setToast({ message: "Could not load job status.", variant: "error" });
        }
      }
    }

    void pollOnce();
    const interval = window.setInterval(() => void pollOnce(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [view, jobId, mutateHistory]);

  useEffect(() => {
    if (view !== "processing" || pollStartedAt == null) {
      return;
    }
    const tick = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - pollStartedAt) / 1000));
      if (Date.now() - pollStartedAt > 120_000) {
        setPollTimedOut(true);
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [view, pollStartedAt]);

  useEffect(() => {
    if (view !== "processing") {
      setElapsedSeconds(0);
      setPollStartedAt(null);
      setPollTimedOut(false);
    }
  }, [view]);

  const onDisconnect = useCallback(async () => {
    try {
      await fetchJson("/api/shopify/connection", { method: "DELETE" });
      setConnection({ connected: false });
      setView("connect");
      setSelectedProduct(null);
      setProducts([]);
      setToast({ message: "Store disconnected", variant: "success" });
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Disconnect failed.",
        variant: "error",
      });
    }
  }, []);

  const onGenerate = useCallback(async () => {
    if (!selectedProduct) {
      return;
    }
    const img = selectedProduct.images?.[0]?.src;
    if (!img) {
      setToast({
        message:
          "This product has no images. Please add a product image in Shopify first.",
        variant: "error",
      });
      return;
    }
    try {
      const data = await fetchJson<{ jobId: string }>("/api/shopify/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(selectedProduct.id),
          productTitle: selectedProduct.title,
          productImageUrl: img,
          productCategory: productCategory.trim(),
          lifestyle,
        }),
      });
      setJobId(data.jobId);
      setJob(null);
      setPollTimedOut(false);
      setView("processing");
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Could not start generation.",
        variant: "error",
      });
    }
  }, [selectedProduct, productCategory, lifestyle]);

  const openJobFromHistory = useCallback(async (id: string) => {
    try {
      const doc = await fetchJson<JobPayload>(`/api/shopify/status/${id}`);
      setJobId(id);
      setJob(doc);
      setSelectedImageUrl(doc.pushedToShopify ? (doc.cloudinaryUrls?.[0] ?? null) : null);
      const p: ShopifyProductRow = {
        id: doc.productId,
        title: doc.productTitle,
        images: [{ src: doc.productImageUrl }],
        product_type: null,
        status: "active",
      };
      setSelectedProduct(p);
      setLifestyle(
        SHOPIFY_PHOTO_LIFESTYLES.includes(doc.lifestyle as ShopifyPhotoLifestyle)
          ? (doc.lifestyle as ShopifyPhotoLifestyle)
          : "studio_white",
      );
      setView("result");
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Could not load that generation.",
        variant: "error",
      });
    }
  }, []);

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

  const connected = connection?.connected === true;

  return (
    <>
      <FeaturePage
        title="Shopify Photos"
        description="Connect your Shopify store to generate and publish lifestyle photos automatically."
      >
        {connLoading ? (
          <div className="mt-8 max-w-6xl space-y-3">
            <div className="h-10 max-w-md animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-48 max-w-lg animate-pulse rounded-xl bg-neutral-100" />
          </div>
        ) : view === "connect" ? (
          <div className="mt-8 max-w-6xl">
            <ConnectView
              initialShop={initialShop}
              onShopRemember={(shop) => {
                try {
                  window.localStorage.setItem(LS_SHOP_DOMAIN, shop);
                } catch {
                  /* ignore */
                }
              }}
            />
          </div>
        ) : (
          <div className="mt-8 max-w-6xl">
            {connected && connection.connected ? (
              <ConnectionBar
                shopName={connection.shopName}
                shopDomain={connection.shopDomain}
                onDisconnect={() => void onDisconnect()}
              />
            ) : null}

            {view === "products" && (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
                <ProductList
                  products={products}
                  loading={productsLoading}
                  error={productsError}
                  onRetry={() => void loadProducts()}
                  selectedId={selectedProduct ? String(selectedProduct.id) : null}
                  onSelect={(p) => {
                    setSelectedProduct(p);
                    setProductCategory(p.product_type?.trim() ?? "");
                  }}
                  search={productSearch}
                  onSearchChange={setProductSearch}
                />
                <div
                  className={
                    "space-y-6 transition-opacity duration-300 " +
                    (!selectedProduct ? "pointer-events-none opacity-50" : "opacity-100")
                  }
                >
                  {selectedProduct ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="relative size-[120px] shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {selectedProduct.images?.[0]?.src ? (
                            <Image
                              src={selectedProduct.images[0].src}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-sm font-semibold text-black">
                            {selectedProduct.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setProductCategory("");
                            }}
                            className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <LifestyleSelector value={lifestyle} onChange={setLifestyle} />
                    <label className="mt-6 block text-sm font-medium text-neutral-700">
                      Product Category
                      <input
                        type="text"
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                        placeholder="e.g. Supplements, Skincare"
                        className={inputClass}
                      />
                    </label>
                    <p className="mt-1 text-xs text-neutral-500">
                      Auto-detected from your Shopify product type
                    </p>
                    <p className="mt-4 text-xs text-neutral-600">
                      ⏱ ~30–50 seconds · 📸 4 photo variations · 💰 ~$0.07 per generation
                    </p>
                    <button
                      type="button"
                      disabled={!selectedProduct}
                      onClick={() => void onGenerate()}
                      className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
                    >
                      Generate Lifestyle Photos →
                    </button>
                  </section>
                </div>
              </div>
            )}

            {view === "processing" && selectedProduct && jobId ? (
              <ProcessingView
                productTitle={selectedProduct.title}
                productThumbUrl={selectedProduct.images?.[0]?.src ?? null}
                lifestyleLabel={lifestyleLabel}
                status={job?.status ?? "queued"}
                errorMessage={job?.errorMessage ?? null}
                elapsedSeconds={elapsedSeconds}
                timedOut={pollTimedOut}
                onTryAgain={() => {
                  setView("products");
                  setJobId(null);
                  setJob(null);
                  setPollTimedOut(false);
                }}
              />
            ) : null}

            {view === "result" && job && selectedProduct && connection && connection.connected ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {selectedProduct.images?.[0]?.src ? (
                        <Image
                          src={selectedProduct.images[0].src}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="truncate font-heading text-sm font-semibold text-black">
                      {selectedProduct.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setView("products");
                        setSelectedImageUrl(null);
                        setJob(null);
                        setJobId(null);
                      }}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
                    >
                      Generate Another
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView("products");
                        setSelectedProduct(null);
                        setProductCategory("");
                        setSelectedImageUrl(null);
                        setJob(null);
                        setJobId(null);
                      }}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
                    >
                      New Product
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <PhotoGrid
                    urls={job.cloudinaryUrls ?? []}
                    lifestyleKey={job.lifestyle}
                    processingTimeMs={job.processingTimeMs ?? null}
                    selectedUrl={selectedImageUrl}
                    onSelect={setSelectedImageUrl}
                  />
                </div>

                {jobId ? (
                  <PushPanel
                    key={`${jobId}-${job.pushedToShopify ? "pushed" : "open"}`}
                    jobId={jobId}
                    productTitle={job.productTitle}
                    productId={job.productId}
                    shopDomain={connection.shopDomain}
                    shopName={connection.shopName}
                    selectedImageUrl={selectedImageUrl}
                    initialPushed={job.status === "pushed" || Boolean(job.pushedToShopify)}
                    onPublished={() => void mutateHistory()}
                    onToast={(m, v) => setToast({ message: m, variant: v })}
                    onGenerateMore={() => {
                      setView("products");
                      setSelectedImageUrl(null);
                      setJob(null);
                      setJobId(null);
                    }}
                  />
                ) : null}

                <HistoryStrip
                  items={historyData?.items ?? []}
                  onSelectJob={(id) => void openJobFromHistory(id)}
                />
              </div>
            ) : null}
          </div>
        )}
      </FeaturePage>

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
    </>
  );
}

export default function ShopifyPhotosPage() {
  return (
    <Suspense
      fallback={
        <FeaturePage
          title="Shopify Photos"
          description="Connect your Shopify store to generate and publish lifestyle photos automatically."
        >
          <div className="mt-8 max-w-6xl space-y-3">
            <div className="h-10 max-w-md animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-48 max-w-lg animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </FeaturePage>
      }
    >
      <ShopifyPhotosPageContent />
    </Suspense>
  );
}
