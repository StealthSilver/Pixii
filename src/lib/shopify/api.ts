const API_VERSION = "2024-01";
const FETCH_TIMEOUT_MS = 15_000;

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ShopInfo = {
  name: string;
  email: string;
  currency: string;
  plan_name: string;
};

export type ShopifyProductImage = {
  id?: number;
  src: string;
  alt?: string | null;
};

export type ShopifyProduct = {
  id: number | string;
  title: string;
  images: ShopifyProductImage[];
  variants: unknown[];
  product_type: string | null;
  tags: string;
  body_html: string;
  status: string;
};

export type ShopifyImage = {
  id: number | string;
  src: string;
  alt?: string | null;
  position?: number;
};

async function shopifyFetch(
  shopDomain: string,
  accessToken: string,
  pathAndQuery: string,
  init: RequestInit = {},
  allowRetry429 = true,
): Promise<Response> {
  const url = `https://${shopDomain}/admin/api/${API_VERSION}/${pathAndQuery}`;
  const run = () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return fetch(url, {
      ...init,
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string>),
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  };

  let res = await run();
  if (res.status === 429 && allowRetry429) {
    await delay(2000);
    res = await run();
  }
  return res;
}

function assertOk(res: Response, bodyPreview: string): void {
  if (!res.ok) {
    const lower = bodyPreview.toLowerCase();
    if (lower.includes("invalid_api_key")) {
      throw new Error(
        "Your Shopify connection has expired. Please reconnect your store.",
      );
    }
    if (res.status === 404 || bodyPreview.includes("Not Found")) {
      throw new Error("Product not found. It may have been deleted from your store.");
    }
    throw new Error(`Shopify API error (${res.status}): ${bodyPreview.slice(0, 280)}`);
  }
}

export async function getShopInfo(
  shopDomain: string,
  accessToken: string,
): Promise<ShopInfo> {
  const res = await shopifyFetch(shopDomain, accessToken, "shop.json");
  const text = await res.text();
  assertOk(res, text);
  const data = JSON.parse(text) as { shop?: ShopInfo };
  const s = data.shop;
  if (!s) {
    throw new Error("Shopify returned no shop object.");
  }
  return {
    name: s.name ?? "",
    email: s.email ?? "",
    currency: s.currency ?? "",
    plan_name: s.plan_name ?? "",
  };
}

export async function getProducts(
  shopDomain: string,
  accessToken: string,
  limit = 10,
): Promise<ShopifyProduct[]> {
  const lim = Math.min(Math.max(limit, 1), 250);
  const res = await shopifyFetch(
    shopDomain,
    accessToken,
    `products.json?limit=${lim}&status=active`,
  );
  const text = await res.text();
  assertOk(res, text);
  const data = JSON.parse(text) as { products?: ShopifyProduct[] };
  const products = data.products ?? [];
  return products.filter((p) => p.status === "active");
}

export async function getProduct(
  shopDomain: string,
  accessToken: string,
  productId: string,
): Promise<ShopifyProduct> {
  const res = await shopifyFetch(
    shopDomain,
    accessToken,
    `products/${encodeURIComponent(productId)}.json`,
  );
  const text = await res.text();
  assertOk(res, text);
  const data = JSON.parse(text) as { product?: ShopifyProduct };
  const p = data.product;
  if (!p) {
    throw new Error("Shopify returned no product.");
  }
  return p;
}

export async function addImageToProduct(
  shopDomain: string,
  accessToken: string,
  productId: string,
  imageUrl: string,
  altText: string,
): Promise<ShopifyImage> {
  const res = await shopifyFetch(
    shopDomain,
    accessToken,
    `products/${encodeURIComponent(productId)}/images.json`,
    {
      method: "POST",
      body: JSON.stringify({
        image: {
          src: imageUrl,
          alt: altText,
          position: 2,
        },
      }),
    },
  );
  const text = await res.text();
  assertOk(res, text);
  const data = JSON.parse(text) as { image?: ShopifyImage };
  const img = data.image;
  if (!img || img.id == null) {
    throw new Error("Shopify returned no image from create.");
  }
  return img;
}
