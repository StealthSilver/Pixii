import type { RoasterJobView } from "./types";

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export function normalizeRoasterJob(raw: Record<string, unknown>): RoasterJobView {
  const ld =
    raw.listingData && typeof raw.listingData === "object"
      ? (raw.listingData as Record<string, unknown>)
      : {};
  const ls =
    raw.listingScore && typeof raw.listingScore === "object"
      ? (raw.listingScore as Record<string, unknown>)
      : {};
  const cs =
    raw.critiqueScript && typeof raw.critiqueScript === "object"
      ? (raw.critiqueScript as Record<string, unknown>)
      : {};

  return {
    _id: String(raw._id ?? ""),
    amazonUrl: String(raw.amazonUrl ?? ""),
    asin: String(raw.asin ?? ""),
    status: String(raw.status ?? ""),
    currentStep: Number(raw.currentStep ?? 0),
    errorMessage:
      raw.errorMessage != null ? String(raw.errorMessage) : undefined,
    listingData: {
      title: String(ld.title ?? ""),
      brand: String(ld.brand ?? ""),
      bulletPoints: arr(ld.bulletPoints),
      description: String(ld.description ?? ""),
      price: String(ld.price ?? ""),
      rating: String(ld.rating ?? ""),
      reviewCount: String(ld.reviewCount ?? ""),
      imageUrls: arr(ld.imageUrls),
      category: String(ld.category ?? ""),
      bsr: String(ld.bsr ?? ""),
      aPlus: Boolean(ld.aPlus),
    },
    listingScore: {
      overallScore: Number(ls.overallScore ?? 0),
      titleScore: Number(ls.titleScore ?? 0),
      bulletScore: Number(ls.bulletScore ?? 0),
      imageScore: Number(ls.imageScore ?? 0),
      descriptionScore: Number(ls.descriptionScore ?? 0),
      pricingScore: Number(ls.pricingScore ?? 0),
      letterGrade: String(ls.letterGrade ?? "F"),
      conversionEstimate: String(ls.conversionEstimate ?? ""),
      titleIssues: arr(ls.titleIssues),
      bulletIssues: arr(ls.bulletIssues),
      imageIssues: arr(ls.imageIssues),
      descriptionIssues: arr(ls.descriptionIssues),
      pricingIssues: arr(ls.pricingIssues),
      quickWins: arr(ls.quickWins),
      titleRewrite: String(ls.titleRewrite ?? ""),
      bulletRewrites: arr(ls.bulletRewrites),
      descriptionRewrite: String(ls.descriptionRewrite ?? ""),
    },
    critiqueScript: {
      intro: String(cs.intro ?? ""),
      scoreSummary: String(cs.scoreSummary ?? ""),
      titleCritique: String(cs.titleCritique ?? ""),
      bulletCritique: String(cs.bulletCritique ?? ""),
      imageCritique: String(cs.imageCritique ?? ""),
      pricingCritique: String(cs.pricingCritique ?? ""),
      quickWins: String(cs.quickWins ?? ""),
      closingChallenge: String(cs.closingChallenge ?? ""),
      fullScript: String(cs.fullScript ?? ""),
      wordCount: Number(cs.wordCount ?? 0),
      durationSeconds: Number(cs.durationSeconds ?? 60),
    },
    voiceoverUrl: String(raw.voiceoverUrl ?? ""),
    avatarFrameUrls: arr(raw.avatarFrameUrls),
    finalVideoUrl: String(raw.finalVideoUrl ?? ""),
    shareableLink: String(raw.shareableLink ?? ""),
    processingTimeMs:
      raw.processingTimeMs != null ? Number(raw.processingTimeMs) : undefined,
  };
}
