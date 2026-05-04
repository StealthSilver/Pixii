/**
 * Amazon HTML often returns protocol-relative (`//m.media-amazon.com/...`)
 * or site-relative image paths. Normalize so thumbnails load in the browser.
 */
export function normalizeAmazonImageUrl(src: string | undefined | null): string {
  const raw = (src ?? "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    try {
      const u = new URL(raw);
      u.search = "";
      return u.toString();
    } catch {
      return raw.split("?")[0] ?? raw;
    }
  }
  if (raw.startsWith("/")) {
    return `https://www.amazon.com${raw}`;
  }
  return raw;
}
