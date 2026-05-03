import * as cheerio from "cheerio";
import { extractAsin as extractAsinFromUrl } from "@/lib/aiCreator/extractAsin";
import { callReviewAnalyticsLlm } from "@/lib/reviewAnalytics/anthropic";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";
import { throttledScraperApiFetch } from "@/lib/reviewAnalytics/scraperThrottle";

export { extractAsinFromUrl as extractAsin };

export type ScrapedListing = {
  asin: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  bulletPoints: string[];
  imageUrl: string;
  bsr: number;
  url: string;
  category: string;
  isUserListing: boolean;
  estimatedMonthlySales: number;
  estimatedMonthlyRevenue: number;
};

function parsePrice(text: string): number {
  const m = text.replace(/[^0-9.]/g, "");
  const n = parseFloat(m);
  return Number.isFinite(n) ? n : 0;
}

function parseRatingFromText(alt: string): number {
  const m = alt.match(/([\d.]+)\s*out of/i);
  if (m) {
    const n = parseFloat(m[1] ?? "0");
    return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
  }
  const m2 = alt.match(/([\d.]+)/);
  if (m2) {
    const n = parseFloat(m2[1] ?? "0");
    return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
  }
  return 0;
}

function extractBsrFromHtml(html: string): number {
  const $ = cheerio.load(html);
  const blocks = [
    $("#productDetails_detailBullets_sections1").text(),
    $("#detailBulletsWrapper_feature_div").text(),
    $("#productDetails_db_sections").text(),
    $("#prodDetails").text(),
  ].join("\n");

  const m = blocks.match(/Best Sellers Rank[^\d#]*#?\s*([\d,]+)/i);
  if (m?.[1]) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 999999;
}

function extractCategoryFromHtml(html: string): string {
  const $ = cheerio.load(html);
  const crumbs = $("#wayfinding-breadcrumbs_feature_div a, ul.a-unordered-list.a-horizontal.a-size-small li span a")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  if (crumbs.length) {
    return crumbs[crumbs.length - 1] ?? crumbs[0] ?? "Amazon";
  }
  return "Amazon";
}

export function findCompetitorAsins(listingHtml: string, userAsin: string): string[] {
  const upperUser = userAsin.toUpperCase();
  const found = new Set<string>();
  const $ = cheerio.load(listingHtml);

  const addFromText = (s: string) => {
    const matches = s.matchAll(/\b([A-Z0-9]{10})\b/gi);
    for (const m of matches) {
      const a = m[1]!.toUpperCase();
      if (a !== upperUser && /^[A-Z0-9]{10}$/.test(a)) {
        found.add(a);
      }
    }
  };

  $("#desktop-dp-sims, #sp_detail, #sims-consolidated-1, #sims-fbt").each((_, el) => {
    addFromText($(el).html() ?? "");
  });

  $("[data-asin]").each((_, el) => {
    const a = ($(el).attr("data-asin") ?? "").toUpperCase();
    if (a && a.length === 10 && a !== upperUser && /^[A-Z0-9]{10}$/.test(a)) {
      found.add(a);
    }
  });

  $("a[href*='/dp/']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/\/dp\/([A-Z0-9]{10})/i);
    if (m?.[1]) {
      const a = m[1].toUpperCase();
      if (a !== upperUser) {
        found.add(a);
      }
    }
  });

  return Array.from(found).slice(0, 9);
}

function baseListing(
  asin: string,
  url: string,
  isUserListing: boolean,
): ScrapedListing {
  return {
    asin,
    title: "",
    brand: "",
    price: 0,
    rating: 0,
    reviewCount: 0,
    bulletPoints: [],
    imageUrl: "",
    bsr: 999999,
    url,
    category: "Amazon",
    isUserListing,
    estimatedMonthlySales: 0,
    estimatedMonthlyRevenue: 0,
  };
}

export function parseListingFromHtml(
  html: string,
  url: string,
  asin: string,
  isUserListing: boolean,
): ScrapedListing {
  const $ = cheerio.load(html);
  let brand =
    $("#bylineInfo").text().trim() ||
    $("#brand").text().trim() ||
    "";
  brand = brand
    .replace(/^Brand:\s*/i, "")
    .replace(/^Visit the\s*/i, "")
    .replace(/\s*Store$/i, "")
    .trim();

  const title = $("#productTitle").text().trim() || "Product";
  const priceText = $(".a-price .a-offscreen").first().text().trim();
  const price = parsePrice(priceText) || 0;

  let rating = 0;
  const ratingAlt =
    $("#acrPopover .a-icon-alt").first().attr("aria-label") ??
    $("#acrCustomerReviewLink .a-icon-alt").first().attr("aria-label") ??
    $(".a-icon-alt").first().attr("aria-label") ??
    $(".a-icon-alt").first().text() ??
    "";
  rating = parseRatingFromText(ratingAlt);

  const rcText = $("#acrCustomerReviewText").first().text();
  const reviewCount = parseInt(rcText.replace(/[^0-9]/g, ""), 10) || 0;

  const bulletPoints = $("#feature-bullets li span.a-list-item")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const imageUrl =
    $("#landingImage").attr("src") ??
    $("#imgBlkFront").attr("src") ??
    $("#main-image-container img").first().attr("src") ??
    "";

  const bsr = extractBsrFromHtml(html);
  const category = extractCategoryFromHtml(html);

  return {
    ...baseListing(asin, url, isUserListing),
    title,
    brand,
    price,
    rating,
    reviewCount,
    bulletPoints,
    imageUrl,
    bsr,
    category,
  };
}

async function claudeSingleListing(
  url: string,
  asin: string,
  isUserListing: boolean,
): Promise<ScrapedListing> {
  const raw = await callReviewAnalyticsLlm({
    system: "You return only valid JSON. No markdown.",
    messages: [
      {
        role: "user",
        content: `Generate realistic Amazon listing data for ASIN: ${asin} (URL: ${url})
Return JSON with: asin, title, brand, price (number), rating (number),
reviewCount (number), bulletPoints (string[]), imageUrl (""), bsr (number),
estimatedMonthlySales (0), estimatedMonthlyRevenue (0), url, category (short string like "Electronics"),
isUserListing (${isUserListing}).
Make it realistic for the product category. Return ONLY JSON.`,
      },
    ],
    maxTokens: 4096,
    timeoutMs: 120_000,
  });
  const o = parseJsonFromClaude<Record<string, unknown>>(raw);
  return {
    asin: String(o.asin ?? asin).slice(0, 10).toUpperCase(),
    title: String(o.title ?? "Product"),
    brand: String(o.brand ?? ""),
    price: typeof o.price === "number" ? o.price : 29.99,
    rating: typeof o.rating === "number" ? o.rating : 4.2,
    reviewCount: typeof o.reviewCount === "number" ? o.reviewCount : 500,
    bulletPoints: Array.isArray(o.bulletPoints)
      ? (o.bulletPoints as unknown[]).map(String)
      : [],
    imageUrl: String(o.imageUrl ?? ""),
    bsr: typeof o.bsr === "number" ? o.bsr : 15000,
    url: String(o.url ?? url),
    category: String(o.category ?? "Amazon"),
    isUserListing,
    estimatedMonthlySales: 0,
    estimatedMonthlyRevenue: 0,
  };
}

async function claudeGenerateCompetitors(
  seed: ScrapedListing,
  count: number,
): Promise<ScrapedListing[]> {
  const raw = await callReviewAnalyticsLlm({
    system: "You return only valid JSON. No markdown.",
    messages: [
      {
        role: "user",
        content: `Generate ${count} realistic Amazon competitor product listings in the same category as this product:
Title: ${seed.title}
Category: ${seed.category}
Return ONLY a JSON array of ${count} objects. Each object: asin (10-char), title, brand, price, rating, reviewCount, bulletPoints (string[]), imageUrl (""), bsr, url (https://www.amazon.com/dp/ASIN), category, isUserListing (false), estimatedMonthlySales (0), estimatedMonthlyRevenue (0).`,
      },
    ],
    maxTokens: 8192,
    timeoutMs: 120_000,
  });
  const arr = parseJsonFromClaude<unknown>(raw);
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.slice(0, count).map((row, i) => {
    const o = row as Record<string, unknown>;
    const asin = String(o.asin ?? `B00000000${i}`).slice(0, 10).toUpperCase();
    return {
      asin,
      title: String(o.title ?? "Competitor"),
      brand: String(o.brand ?? ""),
      price: typeof o.price === "number" ? o.price : 24.99,
      rating: typeof o.rating === "number" ? o.rating : 4.1,
      reviewCount: typeof o.reviewCount === "number" ? o.reviewCount : 300,
      bulletPoints: Array.isArray(o.bulletPoints)
        ? (o.bulletPoints as unknown[]).map(String)
        : [],
      imageUrl: String(o.imageUrl ?? ""),
      bsr: typeof o.bsr === "number" ? o.bsr : 8000 + i * 1000,
      url: String(o.url ?? `https://www.amazon.com/dp/${asin}`),
      category: String(o.category ?? seed.category),
      isUserListing: false,
      estimatedMonthlySales: 0,
      estimatedMonthlyRevenue: 0,
    };
  });
}

async function fetchHtmlViaScraperApi(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPERAPI_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  try {
    const response = await throttledScraperApiFetch(url);
    if (response.status === 429) {
      console.warn("[reviewAnalytics/listing] ScraperAPI 429, fallback");
      return null;
    }
    if (!response.ok) {
      console.warn("[reviewAnalytics/listing] ScraperAPI error", response.status);
      return null;
    }
    return await response.text();
  } catch (e) {
    console.warn("[reviewAnalytics/listing] ScraperAPI request failed", e);
    return null;
  }
}

export async function scrapeAmazonListing(url: string): Promise<ScrapedListing> {
  const asin = extractAsinFromUrl(url);
  if (!asin) {
    throw new Error("Invalid Amazon product URL");
  }
  const normalizedUrl = url.split("?")[0] ?? url;
  const html = await fetchHtmlViaScraperApi(normalizedUrl);
  if (!html || html.length < 500) {
    return claudeSingleListing(normalizedUrl, asin, false);
  }
  try {
    return parseListingFromHtml(html, normalizedUrl, asin, false);
  } catch {
    return claudeSingleListing(normalizedUrl, asin, false);
  }
}

export async function scrapeListingWithCompetitors(
  url: string,
): Promise<{ userListing: ScrapedListing; competitors: ScrapedListing[] }> {
  const asin = extractAsinFromUrl(url);
  if (!asin) {
    throw new Error("Could not extract ASIN");
  }
  const normalizedUrl = url.trim().split("?")[0] ?? url.trim();

  const html = await fetchHtmlViaScraperApi(normalizedUrl);
  let userListing: ScrapedListing;

  if (!html || html.length < 500) {
    userListing = await claudeSingleListing(normalizedUrl, asin, true);
    userListing.isUserListing = true;
    const synthetic = await claudeGenerateCompetitors(userListing, 5);
    return { userListing, competitors: synthetic };
  }

  userListing = parseListingFromHtml(html, normalizedUrl, asin, true);
  userListing.isUserListing = true;

  let competitorAsins = findCompetitorAsins(html, asin);
  if (competitorAsins.length === 0) {
    const synthetic = await claudeGenerateCompetitors(userListing, 5);
    return { userListing, competitors: synthetic };
  }

  competitorAsins = competitorAsins.slice(0, 9);
  const competitors: ScrapedListing[] = [];

  for (const casin of competitorAsins) {
    await new Promise((r) => setTimeout(r, 500));
    const listing = await scrapeAmazonListing(`https://www.amazon.com/dp/${casin}`);
    listing.isUserListing = false;
    competitors.push(listing);
  }

  return { userListing, competitors };
}
