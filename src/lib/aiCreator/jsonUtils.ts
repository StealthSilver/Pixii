/** Pulls the first top-level JSON object or array from mixed model output. */
function extractFirstJsonValue(s: string): string | null {
  const idxObj = s.indexOf("{");
  const idxArr = s.indexOf("[");
  const startCandidates = [idxObj, idxArr].filter((i) => i >= 0);
  if (!startCandidates.length) {
    return null;
  }
  const start = Math.min(...startCandidates);
  const stack: string[] = [];
  const closeFor: Record<string, string> = { "{": "}", "[": "]" };
  let inStr = false;
  let esc = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i]!;
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === "\\") {
        esc = true;
        continue;
      }
      if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{" || c === "[") {
      stack.push(c);
      continue;
    }
    if (c === "}" || c === "]") {
      const open = stack.pop();
      if (!open || closeFor[open] !== c) {
        return null;
      }
      if (stack.length === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Strips optional markdown code fences and parses JSON from Claude responses. */
export function parseJsonFromClaude<T>(raw: string): T {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  s = s.trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    const extracted = extractFirstJsonValue(s);
    if (extracted !== null) {
      return JSON.parse(extracted) as T;
    }
    throw new Error("Could not parse JSON from model response.");
  }
}
