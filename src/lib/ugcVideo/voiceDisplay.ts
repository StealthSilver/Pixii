/** Client-safe voice labels (no server-only imports). */

export const VOICE_ID_TO_DISPLAY_NAME: Record<string, string> = {
  EXAVITQu4vr4xnSDxMaL: "Sarah",
  jBpfuIE2acCO8z3wKNLl: "Matilda",
  XB0fDUnXU5powFXDhCwa: "Charlotte",
  nPczCjzI2devNBz1zQrb: "Brian",
  onwK4e9ZLuTAKqWW03F9: "Daniel",
  N2lVS1w4EtoT3dr4eOWO: "Callum",
};

export function displayNameForVoiceId(voiceId: string): string {
  return VOICE_ID_TO_DISPLAY_NAME[voiceId] ?? voiceId;
}
