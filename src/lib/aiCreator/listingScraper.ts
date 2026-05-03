import * as cheerio from "cheerio";
import { callClaude } from "@/lib/rufusTwin/claude";
import type { ListingData } from "@/lib/aiCreator/types";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";

const ASIN_RE = /(?:^|[/?&])(?:dp|gp\/product|product)\/([A-Z0-9]{10})(?:[^A-Z0-9]|$)|[?&]asin=([A-Z0-9]{10})/i;

export function extractAsin(url: string): string | null {
  try {
    const u = url.trim();
    const matchDp = u.match(/\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    if (matchDp?.[1]?.length === 10) {
      return matchDp[1].toUpperCase();
    }
    const q = u.match(/[?&]asin=([A-Z0-9]{10})/i);
    if (q?.[1]?.length === 10) {
      return q[1].toUpperCase();
    }
    const m = u.match(ASIN_RE);
    if (m?.[1]?.length === 10) {
      return m[1].toUpperCase();
    }
    if (m?.[2]?.length === 10) {
      return m[2].toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

function emptyListing(scrapedAt: Date): ListingData {
  return {
    title: "",
    bulletPoints: [],
    description: "",
    price: "",
    rating: "",
    reviewCount: "",
    imageUrls: [],
    brand: "",
    category: "",
    aPlus: false,
    scrapedAt,
  };
}

function parseListingHtml(html: string): ListingData {
  const $ = cheerio.load(html);
  const scrapedAt = new Date();

  const title = $("#productTitle").first().text().trim();

  const price =
    $(".a-price .a-offscreen").first().text().trim() ||
    $(".a-price-whole").first().text().trim();

  const rating = $(".a-icon-alt").first().text().trim();

  const reviewCount = $("#acrCustomerReviewText").first().text().trim();

  let brand = $("#bylineInfo").first().text().trim();
  brand = brand
    .replace(/^Brand:\s*/i, "")
    .replace(/^Visit the\s*/i, "")
    .replace(/\s*Store\s*$/i, "")
    .trim();

  const bulletPoints: string[] = [];
  $("#feature-bullets li span").each((_i, el) => {
    const t = $(el).text().trim();
    if (t) {
      bulletPoints.push(t);
    }
  });

  const descParts: string[] = [];
  $("#productDescription p").each((_i, el) => {
    descParts.push($(el).text().trim());
  });
  const description = descParts.filter(Boolean).join(" ");

  const imageUrls: string[] = [];
  const landing = $("#landingImage").attr("src");
  if (landing?.startsWith("http")) {
    imageUrls.push(landing);
  }
  $("#altImages img").each((_i, el) => {
    const src = $(el).attr("src");
    if (src?.startsWith("http") && !imageUrls.includes(src)) {
      imageUrls.push(src);
    }
  });

  const aPlus =
    $("#aplus").length > 0 || $("#aplusBrandStory_feature_div").length > 0;

  return {
    title,
    bulletPoints,
    description,
    price,
    rating,
    reviewCount,
    imageUrls,
    brand,
    category: "",
    aPlus,
    scrapedAt,
  };
}

async function fetchListingViaScraperApi(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPERAPI_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  const scraperapiUrl = `http://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&render=true`;
  const response = await fetch(scraperapiUrl, {
    headers: { Accept: "text/html" },
  });
  if (response.status === 429) {
    console.warn(
      "[aiCreator/scraper] ScraperAPI rate limited — using AI fallback.",
    );
    return null;
  }
  if (!response.ok) {
    console.warn(
      "[aiCreator/scraper] ScraperAPI error",
      response.status,
      await response.text().then((t) => t.slice(0, 120)),
    );
    return null;
  }
  return response.text();
}

async function generateFallbackListingData(
  url: string,
  asin: string,
): Promise<ListingData> {
  const system =
    "You output only valid JSON. No markdown. No commentary before or after.";
  const user = `The user wants to analyze Amazon listing: ${url}
ASIN: ${asin}

Based on the ASIN and URL, generate realistic placeholder listing data that represents a typical product in this category. Make it plausible and specific.

Return ONLY JSON matching this exact shape (use double quotes):
{
  "title": string,
  "bulletPoints": string[],
  "description": string,
  "price": string,
  "rating": string,
  "reviewCount": string,
  "imageUrls": string[],
  "brand": string,
  "category": string,
  "aPlus": boolean
}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 4096,
    timeoutMs: 120_000,
  });

  type ClaudeListing = {
    title?: string;
    bulletPoints?: string[];
    description?: string;
    price?: string;
    rating?: string;
    reviewCount?: string;
    imageUrls?: string[];
    brand?: string;
    category?: string;
    aPlus?: boolean;
  };

  const data = parseJsonFromClaude<ClaudeListing>(raw);
  const scrapedAt = new Date();

  return {
    title: String(data.title ?? "Sample product title"),
    bulletPoints: Array.isArray(data.bulletPoints) ? data.bulletPoints : [],
    description: String(data.description ?? ""),
    price: String(data.price ?? ""),
    rating: String(data.rating ?? ""),
    reviewCount: String(data.reviewCount ?? ""),
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    brand: String(data.brand ?? ""),
    category: String(data.category ?? ""),
    aPlus: Boolean(data.aPlus),
    scrapedAt,
  };
}

export async function scrapeAmazonListing(url: string): Promise<ListingData> {
  const scrapedAt = new Date();
  const asin = extractAsin(url);

  let html: string | null = null;
  try {
    html = await fetchListingViaScraperApi(url);
  } catch (e) {
    console.warn("[aiCreator/scraper] ScraperAPI fetch failed:", e);
  }

  if (html && html.length > 500) {
    try {
      const parsed = parseListingHtml(html);
      const usable = parsed.title || parsed.bulletPoints.length > 0;
      if (usable) {
        return parsed;
      }
      if (asin) {
        console.info(
          "[aiCreator/scraper] Parsed HTML empty — Claude fallback for ASIN",
          asin,
        );
        return generateFallbackListingData(url, asin);
      }
    } catch (e) {
      console.warn("[aiCreator/scraper] HTML parse failed:", e);
    }
  }

  if (asin) {
    console.info("[aiCreator/scraper] Using Claude fallback listing for ASIN", asin);
    return generateFallbackListingData(url, asin);
  }

  return emptyListing(scrapedAt);
}
