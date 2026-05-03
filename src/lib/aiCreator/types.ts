export type ListingData = {
  title: string;
  bulletPoints: string[];
  description: string;
  price: string;
  rating: string;
  reviewCount: string;
  imageUrls: string[];
  brand: string;
  category: string;
  aPlus: boolean;
  scrapedAt: Date;
};

export type ListingAnalysis = {
  overallScore: number;
  titleScore: number;
  bulletScore: number;
  imageScore: number;
  descriptionScore: number;
  priceScore: number;
  strengths: string[];
  weaknesses: string[];
  missedKeywords: string[];
  conversionKillers: string[];
};

export type RoastScript = {
  hook: string;
  firstImpression: string;
  titleRoast: string;
  bulletRoast: string;
  imageRoast: string;
  pricingTake: string;
  competitorJab: string;
  redeemingQualities: string;
  callToAction: string;
  fullScript: string;
  durationSeconds: number;
  wordCount: number;
};

export type AvatarResult = {
  frameUrls: string[];
  assembled: boolean;
  finalVideoUrl: string | null;
};

export type InfluencerPersonaId =
  | "savage_sarah"
  | "brutally_honest_brad"
  | "marketing_maven_mia"
  | "conversion_king_carlos"
  | "trendy_tiffany"
  | "data_driven_david";
