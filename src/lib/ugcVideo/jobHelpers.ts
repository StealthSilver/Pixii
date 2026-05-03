import type { UGCJobDoc } from "@/lib/models/ugcJob";
import type { ProductAnalysis } from "@/lib/ugcVideo/types";

export function buildProductAnalysisFromJob(job: UGCJobDoc): ProductAnalysis {
  return {
    productName: job.productName || "Product",
    productDescription: job.productDescription || "",
    productCategory: job.productCategory || "",
    productBenefits: Array.isArray(job.productBenefits) ? job.productBenefits : [],
    targetAudience: job.targetAudience || "",
    suggestedScriptStyles: Array.isArray(job.suggestedScriptStyles)
      ? job.suggestedScriptStyles
      : [],
    suggestedPersonas: Array.isArray(job.suggestedPersonas)
      ? job.suggestedPersonas
      : [],
  };
}
