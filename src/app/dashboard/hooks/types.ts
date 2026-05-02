export type HookPatternJson = {
  _id: string;
  name: string;
  description: string;
  platformTags: string[];
  exampleHooks: string[];
  strengthScore: number;
  weekLabel: string;
  trendHistory: number[];
  usageCount: number;
  createdAt: string;
};

export type DraftJson = {
  _id: string;
  title: string;
  content: string;
  platform: string;
  tone: string;
  patternId: string;
  patternName: string;
  createdAt: string;
};

export type TabId = "library" | "write" | "drafts";
