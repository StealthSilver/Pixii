import { uploadRawFromBuffer } from "@/lib/cloudinary";

const VOICE_ID = "nPczCjzI2devNBz1zQrb";

export async function generateRoasterVoiceover(
  script: string,
  jobId: string,
): Promise<string> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ELEVEN_LABS_API_KEY is not configured.");
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
        model_id: "eleven_turbo_v2",
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
    throw new Error("Voiceover generation failed");
  }

  const audioBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  return uploadRawFromBuffer(buffer, "audio/mpeg", "pixii/roaster/voiceovers", {
    public_id: `roaster_vo_${jobId}`,
  });
}
