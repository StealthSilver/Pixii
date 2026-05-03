/**
 * Extract 11-char YouTube video ID from common URL shapes.
 */
export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?[^#\s]*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m?.[1]) {
      return m[1];
    }
  }
  const amp = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return amp?.[1] ?? null;
}
