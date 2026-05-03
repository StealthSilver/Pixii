import { uploadRawFromBuffer, uploadVideoFromUrl } from "@/lib/cloudinary";
import { runReplicatePrediction } from "@/lib/videoChopper/replicateClient";
import type { AssembleVideoResult, GeneratedScript } from "@/lib/ugcVideo/types";

const DEFORUM_VERSION = "e22e77495f2fb83c34d5fae2ad8ab63c";

const CAPCUT_INSTRUCTIONS = `1. Open CapCut → New Project
2. Import your 4 frames
3. Set each frame to 7-8 seconds
4. Add Audio → import voiceover MP3
5. Add Text → paste captions from the SRT file`;

export function generateSRT(script: GeneratedScript): string {
  const segments: { start: number; end: number; text: string }[] = [
    { start: 0, end: 3, text: script.hook },
    { start: 3, end: 8, text: script.problem },
    { start: 8, end: 20, text: script.solution },
    { start: 20, end: 30, text: script.cta },
  ];

  const blocks: string[] = [];
  let idx = 1;

  function splitWords(text: string, maxWords: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(" "));
    }
    return chunks.length ? chunks : [""];
  }

  const wordsPerSecond = 2.5;

  for (const seg of segments) {
    const lines = splitWords(seg.text, 7);
    const segDuration = seg.end - seg.start;
    const lineDuration = segDuration / Math.max(lines.length, 1);
    let t = seg.start;
    for (const line of lines) {
      const start = t;
      const end = Math.min(seg.end, t + lineDuration);
      const startMs = Math.round(start * 1000);
      const endMs = Math.round(end * 1000);
      const tc = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const fr = ms % 1000;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${fr.toString().padStart(3, "0")}`;
      };
      blocks.push(
        `${idx}\n${tc(startMs)} --> ${tc(endMs)}\n${line}\n`,
      );
      idx += 1;
      t = end;
    }
  }

  return blocks.join("\n");
}

function extractVideoUrl(output: unknown): string | null {
  if (typeof output === "string" && output.startsWith("http")) {
    return output;
  }
  if (Array.isArray(output) && output.length > 0) {
    const last = output[output.length - 1];
    if (typeof last === "string" && last.startsWith("http")) {
      return last;
    }
  }
  if (output && typeof output === "object" && "video" in output) {
    const v = (output as { video?: unknown }).video;
    if (typeof v === "string" && v.startsWith("http")) {
      return v;
    }
  }
  return null;
}

export async function assembleVideo(
  frameUrls: string[],
  voiceoverUrl: string,
  script: GeneratedScript,
  jobId: string,
  platform: string,
): Promise<AssembleVideoResult> {
  const captionsText = generateSRT(script);

  let finalVideoUrl: string | null = null;
  let assemblyPackageUrl: string | null = null;

  const animation_prompts = frameUrls
    .map((_, i) => `${i * 7}:[frame ${i + 1}]`)
    .join(" ");

  try {
    const output = await runReplicatePrediction({
      version: DEFORUM_VERSION,
      input: {
        animation_prompts,
        max_frames: 30 * 30,
        fps: 30,
      },
      pollIntervalMs: 2000,
      maxWaitMs: 90_000,
    });
    const remote = extractVideoUrl(output);
    if (remote) {
      finalVideoUrl = await uploadVideoFromUrl(
        remote,
        "pixii/ugc-video/final",
      );
    }
  } catch (e) {
    console.warn("[ugcVideo/assemble] Replicate assembly failed:", e);
  }

  if (!finalVideoUrl) {
    const pkg = {
      assembled: false,
      reason: "serverless_limitation",
      frames: frameUrls,
      voiceover: voiceoverUrl,
      script: script.fullScript,
      captionsSrt: captionsText,
      platform,
      instructions: CAPCUT_INSTRUCTIONS,
    };
    const json = JSON.stringify(pkg, null, 2);
    const buf = Buffer.from(json, "utf-8");
    assemblyPackageUrl = await uploadRawFromBuffer(
      buf,
      "application/json",
      "pixii/ugc-video/packages",
      { public_id: `package_${jobId}` },
    );
  }

  return {
    finalVideoUrl,
    assemblyPackageUrl,
    captionsText,
  };
}
