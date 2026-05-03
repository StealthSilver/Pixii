/** Strips optional markdown code fences and parses JSON from Claude responses. */
export function parseJsonFromClaude<T>(raw: string): T {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const parsed = JSON.parse(s) as T;
  return parsed;
}
