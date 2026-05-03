/** Client-safe YouTube ID extraction (no ytdl). */

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^&\s]+&)*v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }
  const m = trimmed.match(YOUTUBE_ID_RE);
  return m?.[1] ?? null;
}
