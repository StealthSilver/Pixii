import { connectDB } from "@/lib/mongodb";
import { MarketEstimate } from "@/lib/models/marketEstimate";
import { extractCategoryFromUrl } from "@/lib/marketEstimator/amazonUrl";
import { scrapeBestSellers } from "@/lib/marketEstimator/bestSellersScraper";
import { estimateRevenue } from "@/lib/marketEstimator/revenueEstimator";
import { analyzeMarket } from "@/lib/marketEstimator/marketAnalyzer";

async function failJob(jobId: string, message: string): Promise<void> {
  await connectDB();
  await MarketEstimate.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

export async function processMarketEstimate(jobId: string): Promise<void> {
  await connectDB();
  const job = await MarketEstimate.findById(jobId).exec();
  if (!job) {
    return;
  }

  const createdAt = job.createdAt?.getTime?.() ?? Date.now();

  try {
    job.status = "scraping";
    job.currentStep = 1;
    job.errorMessage = "";
    await job.save();

    let products;
    try {
      products = await scrapeBestSellers(job.amazonUrl);
    } catch {
      await failJob(jobId, "Could not retrieve listing data");
      return;
    }

    if (!products?.length) {
      await failJob(jobId, "Could not retrieve listing data");
      return;
    }

    const { category, subcategory } = extractCategoryFromUrl(job.amazonUrl);
    job.category = category;
    job.subcategory = subcategory;
    job.scrapedAt = new Date();
    job.products = products.map((p) => ({
      rank: p.rank,
      asin: p.asin,
      title: p.title,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
      imageUrl: p.imageUrl,
      estimatedMonthlySales: 0,
      estimatedMonthlyRevenue: 0,
      url: p.url,
    })) as never;
    await job.save();

    job.status = "estimating";
    job.currentStep = 2;
    await job.save();

    const estimated = estimateRevenue(products, job.category || category);
    job.products = estimated.map((p) => ({
      rank: p.rank,
      asin: p.asin,
      title: p.title,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
      imageUrl: p.imageUrl,
      estimatedMonthlySales: p.estimatedMonthlySales,
      estimatedMonthlyRevenue: p.estimatedMonthlyRevenue,
      url: p.url,
    })) as never;
    await job.save();

    job.status = "analyzing";
    job.currentStep = 3;
    await job.save();

    let analysis;
    try {
      analysis = await analyzeMarket(estimated, job.category || category, job.amazonUrl);
    } catch {
      await failJob(jobId, "Market analysis failed");
      return;
    }

    job.marketAnalysis = analysis;
    await job.save();

    job.status = "complete";
    job.currentStep = 4;
    job.completedAt = new Date();
    job.processingTimeMs = job.completedAt.getTime() - createdAt;
    await job.save();
  } catch (e) {
    console.error("[marketEstimator/pipeline]", jobId, e);
    const msg = e instanceof Error ? e.message : String(e);
    await failJob(jobId, msg || "Processing failed");
  }
}
