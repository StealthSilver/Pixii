/** Client-safe Amazon Best Sellers URL helpers (no cheerio / Node APIs). */

export function validateBestSellersUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/best-sellers") ||
    lower.includes("/zgbs/") ||
    lower.includes("/movers-and-shakers/") ||
    lower.includes("/most-wished-for/")
  );
}

export function extractCategoryFromUrl(url: string): {
  category: string;
  subcategory: string;
} {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    let category = "";
    let subcategory = "";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i] ?? "";
      if (p.toLowerCase().startsWith("best-sellers-")) {
        const rest = p.slice("best-sellers-".length);
        category = rest
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        if (
          category.toLowerCase().includes("sports") &&
          category.toLowerCase().includes("outdoors")
        ) {
          category = "Sports & Outdoors";
        }
      }
      if (p === "zgbs" && parts[i + 1]) {
        const sub = parts[i + 1] ?? "";
        subcategory = sub
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        if (sub.toLowerCase() === "sporting-goods") {
          subcategory = "Sporting Goods";
        }
      }
    }
    return {
      category: category || "Amazon",
      subcategory: subcategory || "",
    };
  } catch {
    return { category: "Amazon", subcategory: "" };
  }
}
