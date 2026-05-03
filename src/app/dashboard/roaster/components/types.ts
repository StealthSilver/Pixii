export type HistoryStripItem = {
  _id: string;
  title: string;
  brand: string;
  thumbUrl: string;
  overallScore: number;
  letterGrade: string;
  createdAt: string;
};

export type RoasterJobView = {
  _id: string;
  amazonUrl: string;
  asin: string;
  status: string;
  currentStep: number;
  errorMessage?: string;
  listingData: {
    title: string;
    brand: string;
    bulletPoints: string[];
    description: string;
    price: string;
    rating: string;
    reviewCount: string;
    imageUrls: string[];
    category: string;
    bsr: string;
    aPlus: boolean;
  };
  listingScore: {
    overallScore: number;
    titleScore: number;
    bulletScore: number;
    imageScore: number;
    descriptionScore: number;
    pricingScore: number;
    letterGrade: string;
    conversionEstimate: string;
    titleIssues: string[];
    bulletIssues: string[];
    imageIssues: string[];
    descriptionIssues: string[];
    pricingIssues: string[];
    quickWins: string[];
    titleRewrite: string;
    bulletRewrites: string[];
    descriptionRewrite: string;
  };
  critiqueScript: {
    intro: string;
    scoreSummary: string;
    titleCritique: string;
    bulletCritique: string;
    imageCritique: string;
    pricingCritique: string;
    quickWins: string;
    closingChallenge: string;
    fullScript: string;
    wordCount: number;
    durationSeconds: number;
  };
  voiceoverUrl: string;
  avatarFrameUrls: string[];
  finalVideoUrl: string;
  shareableLink: string;
  processingTimeMs?: number;
};
