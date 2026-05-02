export const RUFUS_QUERY_TYPES = [
  "product_recommendation",
  "product_comparison",
  "use_case",
  "ingredient_question",
  "concern_question",
  "brand_question",
] as const;

export type RufusQueryType = (typeof RUFUS_QUERY_TYPES)[number];

export type ResponseFactorImportance = "high" | "medium" | "low";

export type ResponseFactor = {
  factor: string;
  importance: ResponseFactorImportance;
  explanation: string;
  listingTip: string;
};

export type CompetitorProduct = {
  name: string;
  brand: string;
  whyRufusLikes: string;
  keyAttributes: string[];
  estimatedRank: number;
};

export type ListingScore = {
  asin: string;
  productTitle: string;
  overallScore: number;
  titleScore: number;
  bulletScore: number;
  descriptionScore: number;
  reviewScore: number;
  gaps: string[];
  improvements: string[];
};

export type QueryAnalysisResult = {
  queryType: RufusQueryType;
  category: string;
  searchIntent: string;
  keyFactors: string[];
  amazonContext: string;
};

export type RufusSimulationResult = {
  queryType: string;
  category: string;
  simulatedResponse: string;
  responseFactors: ResponseFactor[];
  competitorProducts: CompetitorProduct[];
  listingScore: ListingScore | null;
  relatedQuestions: string[];
};

export type ListingDetailsInput = {
  asin?: string;
  title: string;
  bullets: string[];
  description: string;
  category: string;
};

export type ProductDetailsInput = {
  asin?: string;
  title?: string;
  bullets?: string[];
  description?: string;
  category?: string;
};
