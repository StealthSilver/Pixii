import type { ScrapedListing } from "@/lib/reviewAnalytics/listingScraper";

export type ListingWithRevenue = ScrapedListing & {
  estimatedMonthlySales: number;
  estimatedMonthlyRevenue: number;
};

const CATEGORY_MULTIPLIERS: Record<string, number> = {
  books: 8.5,
  kindle: 7.0,
  toys: 5.5,
  games: 4.5,
  sports: 3.8,
  beauty: 4.2,
  health: 4.0,
  electronics: 2.5,
  clothing: 3.2,
  home: 3.5,
  kitchen: 4.0,
  grocery: 5.0,
  pet: 4.5,
  automotive: 2.2,
  tools: 2.8,
  office: 3.0,
  default: 3.5,
};

function getCategoryMultiplier(category: string): number {
  const lower = category.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MULTIPLIERS)) {
    if (key !== "default" && lower.includes(key)) {
      return val;
    }
  }
  return CATEGORY_MULTIPLIERS.default;
}

function estimateMonthlySales(rank: number, category: string): number {
  const multiplier = getCategoryMultiplier(category);
  const baseSales = Math.round(multiplier * Math.pow(rank, -0.8) * 100_000);
  return Math.max(10, baseSales);
}

export function estimateRevenueForListings(
  listings: ScrapedListing[],
  category: string,
): ListingWithRevenue[] {
  return listings.map((listing, index) => {
    let rank = listing.bsr;
    if (!rank || rank === 999999) {
      rank = index + 1;
    }
    const estimatedMonthlySales = estimateMonthlySales(rank, category);
    const estimatedMonthlyRevenue = estimatedMonthlySales * listing.price;
    return {
      ...listing,
      estimatedMonthlySales,
      estimatedMonthlyRevenue,
    };
  });
}
