import * as cheerio from "cheerio";
import { callClaude } from "@/lib/rufusTwin/claude";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";
import { throttledScraperApiFetch } from "@/lib/reviewAnalytics/scraperThrottle";

export type ScrapedReview = {
  asin: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  helpfulVotes: number;
  reviewDate: Date | null;
};

function parseReviewDate(text: string): Date | null {
  const m = text.match(
    /on\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})/i,
  );
  if (m?.[1]) {
    const d = new Date(m[1]);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function reviewsUrl(asin: string, page: number, sortBy: "recent" | "helpful"): string {
  const sort = sortBy === "recent" ? "recent" : "helpful";
  return `https://www.amazon.com/product-reviews/${asin}/?sortBy=${sort}&pageNumber=${page}`;
}

function parseReviewsPage(html: string, asin: string): ScrapedReview[] {
  const $ = cheerio.load(html);
  const out: ScrapedReview[] = [];
  $('[data-hook="review"]').each((_, el) => {
    const $el = $(el);
    const ratingText =
      $el.find('[data-hook="review-star-rating"] .a-icon-alt').first().text() ||
      $el.find("i.review-rating").first().text() ||
      "";
    const ratingMatch = ratingText.match(/(\d)/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]!, 10) : 0;

    const titleSpans = $el.find('[data-hook="review-title"] span');
    const title =
      titleSpans.length > 0
        ? titleSpans.last().text().trim()
        : $el.find('[data-hook="review-title"]').text().trim();

    const body = $el.find('[data-hook="review-body"] span').text().trim();
    const verified = $el.find('[data-hook="avp-badge"]').length > 0;
    const helpfulText = $el.find('[data-hook="helpful-vote-statement"]').text();
    const helpful = parseInt(helpfulText.replace(/[^0-9]/g, ""), 10) || 0;
    const dateStr = $el.find('[data-hook="review-date"]').text().trim();
    const reviewDate = parseReviewDate(dateStr);

    if (body || title) {
      out.push({
        asin,
        rating: Math.min(5, Math.max(0, rating)),
        title,
        body,
        verifiedPurchase: verified,
        helpfulVotes: helpful,
        reviewDate,
      });
    }
  });
  return out;
}

async function fetchReviewsHtml(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPERAPI_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  try {
    const response = await throttledScraperApiFetch(url);
    if (response.status === 429) {
      console.warn("[reviewAnalytics/reviews] ScraperAPI 429, fallback");
      return null;
    }
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

async function claudeReviews(
  asin: string,
  title: string,
  count: number,
): Promise<ScrapedReview[]> {
  const raw = await callClaude({
    system: "You return only valid JSON. No markdown.",
    messages: [
      {
        role: "user",
        content: `Generate ${count} realistic Amazon customer reviews for ASIN ${asin} (${title}).
Mix of ratings: mostly 4-5 star, some 3 star, a few 1-2 star.
Make reviews specific, realistic, varied in length.
Return ONLY JSON array, each item: { rating, title, body, verifiedPurchase, helpfulVotes, reviewDate } (reviewDate ISO string).`,
      },
    ],
    maxTokens: 8192,
    timeoutMs: 120_000,
  });
  const arr = parseJsonFromClaude<unknown>(raw);
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map((row) => {
    const o = row as Record<string, unknown>;
    const rd = o.reviewDate;
    let reviewDate: Date | null = null;
    if (typeof rd === "string") {
      const d = new Date(rd);
      reviewDate = Number.isNaN(d.getTime()) ? null : d;
    }
    return {
      asin,
      rating: Math.min(5, Math.max(1, Number(o.rating ?? 4))),
      title: String(o.title ?? ""),
      body: String(o.body ?? ""),
      verifiedPurchase: Boolean(o.verifiedPurchase),
      helpfulVotes: typeof o.helpfulVotes === "number" ? o.helpfulVotes : 0,
      reviewDate,
    };
  });
}

function dedupeKey(r: ScrapedReview): string {
  return `${r.rating}|${r.title}|${r.body.slice(0, 120)}`;
}

export async function scrapeReviewsForAsin(
  asin: string,
  maxReviews: number,
  productTitle?: string,
): Promise<ScrapedReview[]> {
  const cap = Math.min(100, Math.max(1, maxReviews));
  const collected: ScrapedReview[] = [];
  const seen = new Set<string>();

  const pushUnique = (batch: ScrapedReview[]) => {
    for (const r of batch) {
      const k = dedupeKey(r);
      if (seen.has(k)) {
        continue;
      }
      seen.add(k);
      collected.push(r);
      if (collected.length >= cap) {
        return true;
      }
    }
    return false;
  };

  const sorts: Array<"recent" | "helpful"> = ["recent", "helpful"];

  for (const sort of sorts) {
    for (let page = 1; page <= 10 && collected.length < cap; page++) {
      const url = reviewsUrl(asin, page, sort);
      const html = await fetchReviewsHtml(url);
      if (!html) {
        break;
      }
      const pageReviews = parseReviewsPage(html, asin);
      if (pageReviews.length < 5) {
        break;
      }
      if (pushUnique(pageReviews)) {
        break;
      }
    }
    if (collected.length >= cap) {
      break;
    }
  }

  if (collected.length > 0) {
    return collected.slice(0, cap);
  }

  const title = productTitle ?? "product";
  return (await claudeReviews(asin, title, 20)).slice(0, cap);
}

export async function scrapeAllReviews(
  asins: string[],
  reviewsPerListing: number,
  listingTitles?: Record<string, string>,
): Promise<ScrapedReview[]> {
  const all: ScrapedReview[] = [];
  for (let i = 0; i < asins.length; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
    const asin = asins[i]!;
    const title = listingTitles?.[asin];
    const chunk = await scrapeReviewsForAsin(asin, reviewsPerListing, title);
    all.push(...chunk);
  }
  return all;
}
