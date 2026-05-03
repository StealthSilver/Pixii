import { uploadRawFromBuffer } from "@/lib/cloudinary";
import {
  formatElevenLabsErrorBody,
  resolveElevenLabsApiKey,
} from "@/lib/elevenlabs/apiKey";

const VOICE_ID = "nPczCjzI2devNBz1zQrb";

/** Prefer Flash (recommended); override with ELEVENLABS_TTS_MODEL_ID if needed. */
function roasterTtsModelId(): string {
  return (
    process.env.ELEVENLABS_TTS_MODEL_ID?.trim() || "eleven_flash_v2"
  );
}

export async function generateRoasterVoiceover(
  script: string,
  jobId: string,
): Promise<string> {
  const apiKey = resolveElevenLabsApiKey();
  if (!apiKey) {
    throw new Error(
      "ElevenLabs API key is not configured. Set ELEVEN_LABS_API_KEY (or ELEVENLABS_API_KEY) in .env.local.",
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script,
        model_id: roasterTtsModelId(),
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!response.ok) {
    const t = await response.text();
    console.warn("[roaster/voiceover] ElevenLabs error", response.status, t.slice(0, 200));
    const friendly = formatElevenLabsErrorBody(response.status, t);
    throw new Error(`Voiceover failed (${response.status}): ${friendly}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  return uploadRawFromBuffer(buffer, "audio/mpeg", "pixii/roaster/voiceovers", {
    public_id: `roaster_vo_${jobId}`,
  });
}
