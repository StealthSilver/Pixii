import { uploadRawFromBuffer } from "@/lib/cloudinary";
import {
  formatElevenLabsErrorBody,
  resolveElevenLabsApiKey,
} from "@/lib/elevenlabs/apiKey";
import type { PersonaConfig } from "@/lib/ugcVideo/types";

const SARAH = "EXAVITQu4vr4xnSDxMaL";
const MATILDA = "jBpfuIE2acCO8z3wKNLl";
const CHARLOTTE = "XB0fDUnXU5powFXDhCwa";
const BRIAN = "nPczCjzI2devNBz1zQrb";
const DANIEL = "onwK4e9ZLuTAKqWW03F9";
const CALLUM = "N2lVS1w4EtoT3dr4eOWO";

export function getVoiceForPersona(persona: PersonaConfig): string {
  const { gender, style } = persona;

  if (gender === "female") {
    if (["casual", "beauty_guru", "mom"].includes(style)) {
      return SARAH;
    }
    if (["fitness", "entrepreneur"].includes(style)) {
      return MATILDA;
    }
    if (["student", "professional"].includes(style)) {
      return CHARLOTTE;
    }
    return SARAH;
  }

  if (gender === "male") {
    if (["casual", "student"].includes(style)) {
      return BRIAN;
    }
    if (["professional", "entrepreneur"].includes(style)) {
      return DANIEL;
    }
    if (style === "fitness") {
      return CALLUM;
    }
    return BRIAN;
  }

  if (gender === "non_binary") {
    if (style === "casual") {
      return SARAH;
    }
    return SARAH;
  }

  return SARAH;
}

export async function generateVoiceover(
  script: string,
  voiceId: string,
  jobId: string,
): Promise<string> {
  const apiKey = resolveElevenLabsApiKey();
  if (!apiKey) {
    throw new Error(
      "ElevenLabs API key is not configured. Set ELEVEN_LABS_API_KEY (or ELEVENLABS_API_KEY) in .env.local.",
    );
  }

  const charCount = script.length;
  if (charCount > 10_000) {
    throw new Error("Script too long for voiceover");
  }
  console.info(
    `[ugcVideo/voiceover] job=${jobId} chars=${charCount} voice=${voiceId}`,
  );

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (res.status === 422) {
    throw new Error("Script too long for voiceover");
  }
  if (res.status === 429) {
    throw new Error(
      "ElevenLabs rate limit reached. Please try again in a moment.",
    );
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(formatElevenLabsErrorBody(res.status, t));
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const secureUrl = await uploadRawFromBuffer(
    buffer,
    "audio/mpeg",
    "pixii/ugc-video/voiceovers",
    { public_id: `voiceover_${jobId}` },
  );

  return secureUrl;
}
