/** Extract Amazon ASIN from product URLs (no cheerio — safe for client import). */
export function extractAsin(url: string): string | null {
  try {
    const u = url.trim();
    const matchDp = u.match(
      /\/(?:dp|gp\/product|product)\/([A-Z0-9]{10})(?:[/?]|$)/i,
    );
    if (matchDp?.[1]?.length === 10) {
      return matchDp[1].toUpperCase();
    }
    const q = u.match(/[?&]asin=([A-Z0-9]{10})/i);
    if (q?.[1]?.length === 10) {
      return q[1].toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}
