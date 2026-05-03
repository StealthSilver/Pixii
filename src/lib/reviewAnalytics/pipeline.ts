import { connectDB } from "@/lib/mongodb";
import { ReviewAnalysis } from "@/lib/models/reviewAnalysis";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import {
  scrapeListingWithCompetitors,
  type ScrapedListing,
} from "@/lib/reviewAnalytics/listingScraper";
import { scrapeAllReviews } from "@/lib/reviewAnalytics/reviewScraper";
import type { ListingWithRevenue } from "@/lib/reviewAnalytics/revenueEstimator";

function toJobListing(
  l: ScrapedListing & { estimatedMonthlySales?: number; estimatedMonthlyRevenue?: number },
) {
  return {
    asin: l.asin,
    title: l.title,
    brand: l.brand,
    price: l.price,
    rating: l.rating,
    reviewCount: l.reviewCount,
    imageUrl: l.imageUrl,
    url: l.url,
    bulletPoints: l.bulletPoints ?? [],
    bsr: l.bsr,
    estimatedMonthlySales: l.estimatedMonthlySales ?? 0,
    estimatedMonthlyRevenue: l.estimatedMonthlyRevenue ?? 0,
    isUserListing: Boolean(l.isUserListing),
    reviewsScraped: 0,
    avgSentimentScore: 0,
  };
}

async function failJob(jobId: string, message: string): Promise<void> {
  await connectDB();
  await ReviewAnalysis.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

export async function processReviewAnalysis(jobId: string): Promise<void> {
  await connectDB();
  const job = await ReviewAnalysis.findById(jobId).exec();
  if (!job) {
    return;
  }

  const createdAt = job.createdAt?.getTime?.() ?? Date.now();

  try {
    // STEP 1 — listings
    job.status = "scraping_listings";
    job.currentStep = 1;
    job.errorMessage = "";
    await job.save();

    let userListing: ScrapedListing;
    let competitors: ScrapedListing[];
    try {
      const scraped = await scrapeListingWithCompetitors(job.amazonUrl);
      userListing = scraped.userListing;
      competitors = scraped.competitors;
    } catch (e) {
      console.error("[reviewAnalytics/pipeline] step1", e);
      await failJob(jobId, e instanceof Error ? e.message : "Listing scrape failed");
      return;
    }

    const allScraped: ScrapedListing[] = [
      { ...userListing, isUserListing: true },
      ...competitors.map((c) => ({ ...c, isUserListing: false })),
    ];

    const userAsin = extractAsin(job.amazonUrl);
    job.userAsin = userAsin ?? userListing.asin;
    job.category = userListing.category || "Amazon";
    job.scrapedAt = new Date();
    job.listings = allScraped.map(toJobListing) as never;
    job.totalListingsScraped = allScraped.length;
    await job.save();

    // STEP 2 — reviews
    job.status = "scraping_reviews";
    job.currentStep = 2;
    await job.save();

    const asins = allScraped.map((l) => l.asin);
    const reviewsPerListing = Math.min(
      100,
      Math.ceil(1000 / Math.max(1, asins.length)),
    );
    const titleByAsin: Record<string, string> = {};
    for (const l of allScraped) {
      titleByAsin[l.asin] = l.title;
    }

    let reviewRows: Awaited<ReturnType<typeof scrapeAllReviews>>;
    try {
      reviewRows = await scrapeAllReviews(asins, reviewsPerListing, titleByAsin);
    } catch (e) {
      console.error("[reviewAnalytics/pipeline] step2", e);
      await failJob(jobId, e instanceof Error ? e.message : "Review scrape failed");
      return;
    }

    if (!reviewRows.length) {
      await failJob(
        jobId,
        "Could not scrape any reviews for this product",
      );
      return;
    }

    const counts = new Map<string, number>();
    for (const r of reviewRows) {
      counts.set(r.asin, (counts.get(r.asin) ?? 0) + 1);
    }

    job.reviews = reviewRows.map((r) => ({
      asin: r.asin,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verifiedPurchase: r.verifiedPurchase,
      helpfulVotes: r.helpfulVotes,
      reviewDate: r.reviewDate ?? undefined,
      sentimentScore: 0,
    })) as never;

    job.totalReviewsScraped = reviewRows.length;

    const listingsWithCounts = (job.listings as unknown[]).map((row) => {
      const o = row as Record<string, unknown>;
      const asin = String(o.asin ?? "");
      return {
        ...o,
        reviewsScraped: counts.get(asin) ?? 0,
      };
    });
    job.listings = listingsWithCounts as never;
    await job.save();

    // STEP 3 — revenue
    job.status = "estimating";
    job.currentStep = 3;
    await job.save();

    const listingsForEst: ScrapedListing[] = allScraped.map((l, i) => ({
      ...l,
      bsr: l.bsr,
    }));
    const withRev = estimateRevenueForListings(
      listingsForEst,
      job.category || "Amazon",
    );

    job.listings = withRev.map((l, idx) => ({
      ...toJobListing(l),
      reviewsScraped: counts.get(l.asin) ?? 0,
      avgSentimentScore: (listingsWithCounts[idx] as { avgSentimentScore?: number })
        ?.avgSentimentScore ?? 0,
    })) as never;
    await job.save();

    // STEP 4 — analyze
    job.status = "analyzing";
    job.currentStep = 4;
    await job.save();

    let analysis: Awaited<ReturnType<typeof analyzeReviews>>;
    try {
      analysis = await analyzeReviews(
        withRev as ListingWithRevenue[],
        reviewRows,
        job.userAsin,
        job.category || "Amazon",
      );
    } catch (e) {
      console.error("[reviewAnalytics/pipeline] step4", e);
      await failJob(jobId, e instanceof Error ? e.message : "AI analysis failed");
      return;
    }

    job.purchaseCriteria = analysis.purchaseCriteria as never;
    job.marketIntelligence = analysis.marketIntelligence as never;

    const sentiMap = new Map<string, number>();
    const sumByAsin = new Map<string, { sum: number; n: number }>();
    for (const r of analysis.reviewsWithSentiment) {
      const k = `${r.asin}|${r.rating}|${r.title}|${r.body.slice(0, 80)}`;
      sentiMap.set(k, r.sentimentScore);
      const agg = sumByAsin.get(r.asin) ?? { sum: 0, n: 0 };
      agg.sum += r.sentimentScore;
      agg.n += 1;
      sumByAsin.set(r.asin, agg);
    }

    job.reviews = reviewRows.map((r) => {
      const k = `${r.asin}|${r.rating}|${r.title}|${r.body.slice(0, 80)}`;
      const sentimentScore = sentiMap.get(k) ?? Math.min(100, Math.max(0, (r.rating || 3) * 20));
      return {
        asin: r.asin,
        rating: r.rating,
        title: r.title,
        body: r.body,
        verifiedPurchase: r.verifiedPurchase,
        helpfulVotes: r.helpfulVotes,
        reviewDate: r.reviewDate ?? undefined,
        sentimentScore,
      };
    }) as never;

    job.listings = withRev.map((l) => {
      const agg = sumByAsin.get(l.asin);
      const avgSentimentScore =
        agg && agg.n > 0 ? Math.round(agg.sum / agg.n) : 0;
      return {
        ...toJobListing(l),
        estimatedMonthlySales: l.estimatedMonthlySales,
        estimatedMonthlyRevenue: l.estimatedMonthlyRevenue,
        reviewsScraped: counts.get(l.asin) ?? 0,
        avgSentimentScore,
      };
    }) as never;

    await job.save();

    // STEP 5 — complete
    job.status = "complete";
    job.currentStep = 5;
    job.completedAt = new Date();
    job.processingTimeMs = job.completedAt.getTime() - createdAt;
    await job.save();
  } catch (e) {
    console.error("[reviewAnalytics/pipeline]", jobId, e);
    const msg = e instanceof Error ? e.message : String(e);
    await failJob(jobId, msg || "Processing failed");
  }
}
