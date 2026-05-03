export type PersonaGender = "female" | "male" | "non_binary";

export type PersonaAgeRange = "18-25" | "25-35" | "35-45" | "45+";

export type PersonaStyle =
  | "casual"
  | "professional"
  | "fitness"
  | "beauty_guru"
  | "mom"
  | "student"
  | "entrepreneur";

export type PersonaConfig = {
  gender: PersonaGender;
  ageRange: PersonaAgeRange;
  style: PersonaStyle;
  ethnicity: string;
};

export type ProductAnalysis = {
  productName: string;
  productDescription: string;
  productCategory: string;
  productBenefits: string[];
  targetAudience: string;
  suggestedScriptStyles: string[];
  suggestedPersonas: string[];
};

export type GeneratedScript = {
  hook: string;
  problem: string;
  solution: string;
  cta: string;
  fullScript: string;
  durationSeconds: number;
  wordCount: number;
};

export type AssembleVideoResult = {
  finalVideoUrl: string | null;
  assemblyPackageUrl: string | null;
  captionsText: string;
};
