/** Pull JSON object/array from model output (markdown fences or raw). */
export function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```/i.exec(trimmed);
  if (fence?.[1]) {
    return fence[1].trim();
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
  return trimmed.slice(start);
}
