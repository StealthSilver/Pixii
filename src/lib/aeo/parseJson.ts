export function stripJsonFences(text: string): string {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return t.trim();
}

export function parseJsonObject<T>(text: string): T {
  const raw = stripJsonFences(text);
  try {
    return JSON.parse(raw) as T;
  } catch {
    const normalized = raw
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null");
    return JSON.parse(normalized) as T;
  }
}

export function parseJsonStringArray(text: string): string[] {
  const raw = stripJsonFences(text);
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array");
  }
  return parsed.map((x) => String(x));
}
