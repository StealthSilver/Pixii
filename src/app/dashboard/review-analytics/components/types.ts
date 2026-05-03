export type ReviewListingRow = {
  asin: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  bulletPoints: string[];
  bsr: number;
  estimatedMonthlySales: number;
  estimatedMonthlyRevenue: number;
  isUserListing: boolean;
  reviewsScraped: number;
  avgSentimentScore: number;
};

export type PurchaseCriteriaRow = {
  criteriaName: string;
  importanceScore: number;
  satisfactionScore: number;
  mentionCount: number;
  topPositiveQuote: string;
  topNegativeQuote: string;
  yourListingScore: number;
  competitorAvgScore: number;
};

export type MarketIntelDto = {
  topPraisedFeatures: string[];
  topComplaints: string[];
  unmetNeeds: string[];
  yourStrengths: string[];
  yourWeaknesses: string[];
  listingImprovements: string[];
  keyInsight: string;
  marketSentimentScore: number;
  reviewVelocityTrend: string;
};

export type ReviewJob = {
  _id: string;
  amazonUrl: string;
  userAsin: string;
  category: string;
  listings: ReviewListingRow[];
  purchaseCriteria: PurchaseCriteriaRow[];
  marketIntelligence: MarketIntelDto;
  status: string;
  currentStep: number;
  totalReviewsScraped: number;
  totalListingsScraped: number;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
};

export type HistoryStripItem = {
  _id: string;
  amazonUrl: string;
  userAsin: string;
  category: string;
  listings: ReviewListingRow[];
  marketIntelligence: {
    keyInsight: string;
    marketSentimentScore: number;
  };
  totalReviewsScraped: number;
  totalListingsScraped: number;
  createdAt?: string;
};
