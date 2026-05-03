export type NavSearchItem = {
  id: string;
  title: string;
  href: string;
  section: string;
  /** Extra synonyms and phrases for fuzzy matching (not shown in UI). */
  keywords: string;
};

/** Entries mirrored from the sidebar plus Home; weighted fuzzy match uses title, section, keywords. */
export const NAV_SEARCH_INDEX: NavSearchItem[] = [
  {
    id: "home",
    title: "Home",
    href: "/",
    section: "App",
    keywords:
      "landing workspace pixii start dashboard overview root catalog browse",
  },
  {
    id: "hooks",
    title: "Hooks",
    href: "/hook",
    section: "Intelligence",
    keywords:
      "links hooks dashboard copy positioning messaging listing hooks tool",
  },
  {
    id: "aeo",
    title: "AEO",
    href: "/aeo",
    section: "Intelligence",
    keywords:
      "answer engine optimization search ecommerce seo discoverability queries",
  },
  {
    id: "rufus",
    title: "Rufus",
    href: "/rufus",
    section: "Intelligence",
    keywords:
      "rufus twin shopper simulation amazon assistant buyer intent chatbot",
  },
  {
    id: "roaster",
    title: "Roaster",
    href: "/roaster",
    section: "Amazon",
    keywords:
      "roast listings listing optimizer amazon bullets title optimization fire",
  },
  {
    id: "reviews",
    title: "Reviews",
    href: "/reviews",
    section: "Amazon",
    keywords:
      "review analytics sentiment ratings stars feedback voice of customer",
  },
  {
    id: "markets",
    title: "Markets",
    href: "/market",
    section: "Amazon",
    keywords:
      "market estimator sizing demand category trends charts revenue estimate",
  },
  {
    id: "creator",
    title: "Creator",
    href: "/creator",
    section: "Content",
    keywords:
      "ai creator assets copywriting creative generation pen brand content",
  },
  {
    id: "ugc",
    title: "UGC",
    href: "/ugc",
    section: "Content",
    keywords:
      "user generated video ugc creators ads social testimonial authentic",
  },
  {
    id: "clipper",
    title: "Clipper",
    href: "/clipper",
    section: "Content",
    keywords:
      "video chopper clips youtube shorts segments blog extract cut trim",
  },
  {
    id: "studio",
    title: "Studio",
    href: "/studio",
    section: "Visuals",
    keywords:
      "photo upgrader studio image upscale background removal product shots pictures",
  },
  {
    id: "renderer",
    title: "Renderer",
    href: "/renderer",
    section: "Visuals",
    keywords:
      "packaging renderer mockups box label dieline 3d preview cube visuals",
  },
  {
    id: "shopify",
    title: "Shopify",
    href: "/shopify",
    section: "Store",
    keywords:
      "shopify store ecommerce dtc brand storefront theme catalog sync",
  },
];
