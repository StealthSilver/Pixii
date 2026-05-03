import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import { runReplicatePrediction } from "@/lib/videoChopper/replicateClient";

function ensureCloudinaryConfig(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export type TranscriptionResult = {
  fullText: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
};

const WHISPER_VERSION = "4d50797290df275329f202e48c76360b3f22b08d";

function parseWhisperOutput(output: unknown): TranscriptionResult {
  if (!output || typeof output !== "object") {
    return { fullText: "", words: [] };
  }
  const o = output as Record<string, unknown>;
  const fullText =
    typeof o.transcription === "string"
      ? o.transcription
      : typeof o.text === "string"
        ? o.text
        : "";

  const rawWords = o.words;
  const words: TranscriptionResult["words"] = [];
  if (Array.isArray(rawWords)) {
    for (const w of rawWords) {
      if (!w || typeof w !== "object") {
        continue;
      }
      const x = w as Record<string, unknown>;
      const word = typeof x.word === "string" ? x.word : String(x.word ?? "");
      const start = typeof x.start === "number" ? x.start : Number(x.start ?? 0);
      const end = typeof x.end === "number" ? x.end : Number(x.end ?? 0);
      const conf =
        typeof x.probability === "number"
          ? x.probability
          : typeof x.confidence === "number"
            ? x.confidence
            : Number(x.probability ?? x.confidence ?? 0.9);
      words.push({
        word,
        start,
        end,
        confidence: Math.min(1, Math.max(0, conf)),
      });
    }
  }

  return { fullText: fullText.trim(), words };
}

export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const audioBuffer = fs.readFileSync(audioPath);
  const audioBase64 = audioBuffer.toString("base64");
  ensureCloudinaryConfig();

  const uploadResult = await cloudinary.uploader.upload(
    `data:audio/mp3;base64,${audioBase64}`,
    { resource_type: "raw", folder: "pixii/temp-audio" },
  );

  if (!uploadResult?.secure_url || !uploadResult.public_id) {
    throw new Error("Cloudinary audio upload failed.");
  }

  try {
    const output = await runReplicatePrediction({
      version: WHISPER_VERSION,
      input: {
        audio: uploadResult.secure_url,
        model: "large-v3",
        transcription: "word_timestamps",
        language: "en",
      },
      pollIntervalMs: 2000,
      maxWaitMs: 20 * 60 * 1000,
    });

    return parseWhisperOutput(output);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("time") || msg.toLowerCase().includes("timeout")) {
      throw new Error("Transcription timed out. Please try a shorter video.");
    }
    throw e;
  } finally {
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id, {
        resource_type: "raw",
      });
    } catch {
      /* ignore cleanup errors */
    }
    try {
      fs.unlinkSync(audioPath);
    } catch {
      /* ignore */
    }
  }
}
