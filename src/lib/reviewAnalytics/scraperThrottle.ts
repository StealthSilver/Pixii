/** Enforces ≥500ms between ScraperAPI HTTP calls (sequential, global for review analytics). */
let lastScraperApiEnd = 0;

export async function throttledScraperApiFetch(
  targetUrl: string,
): Promise<Response> {
  const apiKey = process.env.SCRAPERAPI_KEY?.trim();
  if (!apiKey) {
    throw new Error("SCRAPERAPI_KEY missing");
  }
  const elapsed = Date.now() - lastScraperApiEnd;
  if (elapsed < 500) {
    await new Promise((r) => setTimeout(r, 500 - elapsed));
  }
  const apiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;
  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(120_000),
    });
    return response;
  } finally {
    lastScraperApiEnd = Date.now();
  }
}
