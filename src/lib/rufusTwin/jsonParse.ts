/** Walk from first `{` and return the substring for the first balanced `{...}` (strings respected). */
export function extractBalancedJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) {
    return null;
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") {
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Pull JSON object/array from model output (markdown fences or raw). */
export function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```/i.exec(trimmed);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    const balanced = extractBalancedJsonObject(inner);
    return balanced ?? inner;
  }
  const startObj = trimmed.indexOf("{");
  const startArr = trimmed.indexOf("[");
  let start = -1;
  if (startObj === -1) {
    start = startArr;
  } else if (startArr === -1) {
    start = startObj;
  } else {
    start = Math.min(startObj, startArr);
  }
  if (start < 0) {
    return trimmed;
  }
  const tail = trimmed.slice(start);
  if (start === startObj) {
    const balanced = extractBalancedJsonObject(tail);
    if (balanced) {
      return balanced;
    }
  }
  return tail;
}
