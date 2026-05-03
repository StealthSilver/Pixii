import type { RoastScript } from "@/lib/aiCreator/types";

function tc(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const fr = ms % 1000;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${fr.toString().padStart(3, "0")}`;
}

function splitWords(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks.length ? chunks : [""];
}

/** SRT captions for creator roast — timing derived from section word counts over durationSeconds. */
export function generateCreatorSRT(script: RoastScript): string {
  const totalSec = Math.max(
    45,
    Math.min(90, script.durationSeconds || 55),
  );
  const segments: { text: string }[] = [
    { text: script.hook },
    { text: script.firstImpression },
    { text: script.titleRoast },
    { text: script.bulletRoast },
    { text: script.imageRoast },
    { text: script.pricingTake },
    { text: script.competitorJab },
    { text: script.redeemingQualities },
    { text: script.callToAction },
  ];

  const wordCounts = segments.map((s) =>
    s.text.split(/\s+/).filter(Boolean).length,
  );
  const totalWords = wordCounts.reduce((a, b) => a + b, 0) || 1;

  const blocks: string[] = [];
  let idx = 1;
  let tSec = 0;

  for (let si = 0; si < segments.length; si++) {
    const segDur = (wordCounts[si] / totalWords) * totalSec;
    const lines = splitWords(segments[si].text, 8);
    const lineDur = segDur / Math.max(lines.length, 1);
    for (const line of lines) {
      const startMs = Math.round(tSec * 1000);
      tSec += lineDur;
      const endMs = Math.round(tSec * 1000);
      blocks.push(`${idx}\n${tc(startMs)} --> ${tc(endMs)}\n${line}\n`);
      idx += 1;
    }
  }

  return blocks.join("\n");
}
