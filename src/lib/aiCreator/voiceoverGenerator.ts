import { uploadRawFromBuffer } from "@/lib/cloudinary";
import {
  formatElevenLabsErrorBody,
  resolveElevenLabsApiKey,
} from "@/lib/elevenlabs/apiKey";

export async function generateCreatorVoiceover(
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
    `[aiCreator/voiceover] job=${jobId} chars=${charCount} voice=${voiceId}`,
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
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.6,
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
    "pixii/ai-creator/voiceovers",
    { public_id: `creator_vo_${jobId}` },
  );

  return secureUrl;
}
