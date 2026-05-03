import { callClaude } from "@/lib/rufusTwin/claude";
import { extractJsonPayload } from "@/lib/rufusTwin/jsonParse";
import type { ClipPlatform } from "@/lib/models/videoChopperJob";
import { CLIP_PLATFORMS } from "@/lib/models/videoChopperJob";

export type IdentifiedClip = {
  clipIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  hookTitle: string;
  whyViral: string;
  platform: ClipPlatform;
  transcriptText: string;
  viralScore: number;
};

function normalizePlatform(p: string): ClipPlatform {
  const x = p.trim().toLowerCase().replace(/-/g, "_");
  if (x === "youtube shorts") {
    return "youtube_shorts";
  }
  if ((CLIP_PLATFORMS as readonly string[]).includes(x)) {
    return x as ClipPlatform;
  }
  return "tiktok";
}

export async function analyzeTranscriptForClips(
  transcript: string,
  videoTitle: string,
  videoDuration: number,
  channelName: string,
  clipCount: number,
): Promise<IdentifiedClip[]> {
  const snippet =
    transcript.length > 6000 ? transcript.slice(0, 6000) + "\n…" : transcript;

  const system = `You are a viral content strategist who has studied thousands of viral short-form videos on TikTok, Instagram Reels, and YouTube Shorts. You deeply understand what makes content go viral: strong hooks, emotional moments, surprising insights, actionable tips, controversial takes, and satisfying payoffs. You specialize in identifying the exact moments in long-form videos that would perform best as standalone short clips.`;

  const userPrompt = `Analyze this transcript from a YouTube video titled '${videoTitle}' by ${channelName}.
Video duration: ${videoDuration} seconds.

Full transcript with timing:
${snippet}

Identify the ${clipCount} best segments to cut as viral short clips. Each clip should be 30-90 seconds long (60 seconds is ideal).

For each clip evaluate:
1. Does it open with a strong hook in the first 5 seconds?
2. Does it deliver a complete thought or story?
3. Is it emotionally engaging, surprising, or immediately useful?
4. Would it make sense without watching the full video?

Return ONLY a JSON array of ${clipCount} objects:
[
  {
    "clipIndex": 0,
    "startTime": seconds as number,
    "endTime": seconds as number,
    "duration": endTime - startTime,
    "hookTitle": "Attention-grabbing title for this clip under 60 chars",
    "whyViral": "One sentence explaining why this moment would go viral",
    "platform": "best platform: tiktok or instagram or youtube_shorts or twitter",
    "transcriptText": "The exact transcript text for this segment",
    "viralScore": number 1-10
  }
]

Sort by viralScore descending.
Ensure no clips overlap in time.
Each clip must be between 20 and 90 seconds.`;

  const tryParse = (text: string): IdentifiedClip[] => {
    const raw = extractJsonPayload(text);
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      throw new Error("not array");
    }
    return arr.map((row, i) => {
      const r = row as Record<string, unknown>;
      return {
        clipIndex: typeof r.clipIndex === "number" ? r.clipIndex : i,
        startTime: Number(r.startTime),
        endTime: Number(r.endTime),
        duration: Number(r.duration ?? Number(r.endTime) - Number(r.startTime)),
        hookTitle: String(r.hookTitle ?? ""),
        whyViral: String(r.whyViral ?? ""),
        platform: normalizePlatform(String(r.platform ?? "tiktok")),
        transcriptText: String(r.transcriptText ?? ""),
        viralScore: Math.min(10, Math.max(1, Number(r.viralScore ?? 5))),
      };
    });
  };

  let text: string;
  try {
    text = await callClaude({
      system,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 8192,
      timeoutMs: 120_000,
    });
  } catch {
    throw new Error("AI analysis failed. Please try again.");
  }

  try {
    const clips = tryParse(text);
    return clips.sort((a, b) => b.viralScore - a.viralScore);
  } catch {
    const strict = `${userPrompt}\n\nIMPORTANT: Your previous output was invalid. Respond with ONLY a raw JSON array. No markdown fences, no commentary.`;
    text = await callClaude({
      system,
      messages: [{ role: "user", content: strict }],
      maxTokens: 8192,
      timeoutMs: 120_000,
    });
    try {
      const clips = tryParse(text);
      return clips.sort((a, b) => b.viralScore - a.viralScore);
    } catch {
      throw new Error("AI analysis failed. Please try again.");
    }
  }
}
