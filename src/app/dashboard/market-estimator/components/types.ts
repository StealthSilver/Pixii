export type MarketProduct = {
  rank: number;
  asin: string;
  title: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  estimatedMonthlySales: number;
  estimatedMonthlyRevenue: number;
  url: string;
};

export type MarketAnalysisDto = {
  totalMarketSizeMonthly: number;
  totalMarketSizeAnnual: number;
  averagePrice: number;
  averageRating: number;
  averageReviewCount: number;
  marketConcentrationScore: number;
  entryDifficultyScore: number;
  opportunityScore: number;
  opportunityGaps: string[];
  marketTrends: string[];
  entryStrategy: string;
  keyInsight: string;
  competitionLevel: string;
};

export type MarketJob = {
  _id: string;
  amazonUrl: string;
  category: string;
  subcategory: string;
  products: MarketProduct[];
  marketAnalysis: MarketAnalysisDto;
  status: string;
  currentStep: number;
  errorMessage?: string;
  createdAt?: string;
};

export type HistoryStripItem = {
  _id: string;
  category: string;
  amazonUrl: string;
  createdAt: string;
  marketAnalysis: {
    totalMarketSizeMonthly: number;
    opportunityScore: number;
    entryDifficultyScore: number;
    competitionLevel: string;
  };
  products: Pick<MarketProduct, "imageUrl" | "title">[];
};
