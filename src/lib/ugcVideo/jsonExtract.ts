/** Strip optional markdown code fence and parse JSON object. */
export function parseJsonObject<T extends Record<string, unknown>>(text: string): T {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const parsed = JSON.parse(s) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Expected JSON object from model.");
  }
  return parsed as T;
}
