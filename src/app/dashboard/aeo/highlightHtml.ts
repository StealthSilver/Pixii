export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightResponseHtml(
  text: string,
  brandName: string,
  competitorNames: string[],
): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  let html = escaped;
  const comps = [...new Set(competitorNames.map((c) => c.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  for (const c of comps) {
    if (!brandName.trim() || c.toLowerCase() === brandName.trim().toLowerCase()) {
      continue;
    }
    const re = new RegExp(escapeRegExp(c), "gi");
    html = html.replace(
      re,
      '<mark class="bg-red-100 text-inherit">$&</mark>',
    );
  }
  if (brandName.trim()) {
    const re = new RegExp(escapeRegExp(brandName.trim()), "gi");
    html = html.replace(
      re,
      '<mark class="bg-yellow-200 text-inherit">$&</mark>',
    );
  }
  return html;
}

export function collectCompetitorNames(parsed: Record<string, unknown>): string[] {
  const list = parsed.competitors_mentioned;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((x) => {
      if (!x || typeof x !== "object") {
        return "";
      }
      return String((x as { name?: unknown }).name ?? "");
    })
    .filter(Boolean);
}
