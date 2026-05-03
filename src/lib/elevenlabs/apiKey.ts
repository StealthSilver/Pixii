/**
 * ElevenLabs accepts the same key under a few env names (project / docs vary).
 */
export function resolveElevenLabsApiKey(): string | null {
  const a = process.env.ELEVEN_LABS_API_KEY?.trim();
  if (a) {
    return a;
  }
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

/** Parse ElevenLabs JSON error bodies into actionable messages. */
export function formatElevenLabsErrorBody(status: number, bodyText: string): string {
  const trimmed = bodyText.trim().slice(0, 600);
  try {
    const parsed = JSON.parse(bodyText) as {
      detail?: { status?: string; message?: string } | string;
    };
    const d = parsed.detail;
    if (d && typeof d === "object") {
      const st = d.status ?? "";
      const msg = d.message ?? "";
      if (
        st === "missing_permissions" ||
        msg.toLowerCase().includes("text_to_speech")
      ) {
        return (
          "ElevenLabs: this API key cannot run Text-to-Speech. " +
          "Open https://elevenlabs.io/app → your profile → API keys: either create a key with the " +
          "`text_to_speech` permission enabled, or use a full-access key (not a restricted key that omits TTS). " +
          "Then set ELEVEN_LABS_API_KEY (or ELEVENLABS_API_KEY) in .env.local and restart the dev server."
        );
      }
      if (msg) {
        return `ElevenLabs (${status}): ${msg}`;
      }
    }
  } catch {
    /* not JSON */
  }
  return trimmed || `ElevenLabs request failed (${status})`;
}
