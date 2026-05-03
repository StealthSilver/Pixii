"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import PhishingIcon from "@mui/icons-material/Phishing";
import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AmazonGlyph,
  BotGlyph,
  CameraGlyph,
  ChartGlyph,
  CubeGlyph,
  EyeGlyph,
  FilmGlyph,
  FlameGlyph,
  PenGlyph,
  ScissorsGlyph,
  SearchGlyph,
  ShopifyGlyph,
  StarGlyph,
  StorefrontGlyph,
} from "@/components/icons/NavGlyphs";

const DEMO_USER_NAME = "Demo User";

/** Primary tint for demo avatar (matches --primary). */
const AVATAR_BG = "BF4F30";

type NavIconProps = Pick<SVGProps<SVGSVGElement>, "className" | "aria-hidden">;

type NavGlyph = ComponentType<NavIconProps>;

function IntelligenceSectionIcon({ className, ...rest }: NavIconProps) {
  return (
    <AutoAwesomeIcon
      className={className}
      aria-hidden={rest["aria-hidden"] === true || rest["aria-hidden"] === "true"}
    />
  );
}

function HooksNavIcon({ className, ...rest }: NavIconProps) {
  return (
    <PhishingIcon
      className={className}
      aria-hidden={rest["aria-hidden"] === true || rest["aria-hidden"] === "true"}
    />
  );
}

function StudioNavIcon({ className, ...rest }: NavIconProps) {
  return (
    <ColorLensIcon
      className={className}
      aria-hidden={rest["aria-hidden"] === true || rest["aria-hidden"] === "true"}
    />
  );
}

type NavEntry = {
  label: string;
  href: string;
  Icon: NavGlyph;
  /** App routes under these paths keep this item active (e.g. dashboard tools). */
  activePathPrefixes?: string[];
};

type NavSection = {
  id: string;
  title: string;
  items: NavEntry[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "intelligence",
    title: "Intelligence",
    items: [
      {
        label: "Hooks",
        href: "/hook",
        Icon: HooksNavIcon,
        activePathPrefixes: ["/dashboard/hooks"],
      },
      {
        label: "AEO",
        href: "/aeo",
        Icon: SearchGlyph,
        activePathPrefixes: ["/dashboard/aeo"],
      },
      {
        label: "Rufus",
        href: "/rufus",
        Icon: BotGlyph,
        activePathPrefixes: ["/dashboard/rufus-twin"],
      },
    ],
  },
  {
    id: "amazon",
    title: "Amazon",
    items: [
      {
        label: "Roaster",
        href: "/roaster",
        Icon: FlameGlyph,
        activePathPrefixes: ["/dashboard/roaster", "/roaster"],
      },
      {
        label: "Reviews",
        href: "/reviews",
        Icon: StarGlyph,
        activePathPrefixes: ["/dashboard/review-analytics", "/reviews"],
      },
      {
        label: "Markets",
        href: "/market",
        Icon: ChartGlyph,
        activePathPrefixes: [
          "/dashboard/market-estimator",
          "/market",
          "/markets",
        ],
      },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      { label: "Creator", href: "/creator", Icon: PenGlyph },
      { label: "UGC", href: "/ugc", Icon: CameraGlyph },
      {
        label: "Clipper",
        href: "/clipper",
        Icon: ScissorsGlyph,
        activePathPrefixes: ["/clipper"],
      },
    ],
  },
  {
    id: "visuals",
    title: "Visuals",
    items: [
      {
        label: "Studio",
        href: "/studio",
        Icon: StudioNavIcon,
        activePathPrefixes: ["/dashboard/photo-upgrader"],
      },
      {
        label: "Renderer",
        href: "/renderer",
        Icon: CubeGlyph,
        activePathPrefixes: ["/dashboard/packaging-renderer"],
      },
    ],
  },
  {
    id: "store",
    title: "Store",
    items: [{ label: "Shopify", href: "/shopify", Icon: ShopifyGlyph }],
  },
];

function SectionIcon({ sectionId }: { sectionId: string }) {
  const cls = "size-4 shrink-0 text-primary/80";
  switch (sectionId) {
    case "intelligence":
      return <IntelligenceSectionIcon className={cls} aria-hidden />;
    case "amazon":
      return <AmazonGlyph className={cls} />;
    case "content":
      return <FilmGlyph className={cls} />;
    case "visuals":
      return <EyeGlyph className={cls} />;
    case "store":
      return <StorefrontGlyph className={cls} />;
    default:
      return null;
  }
}

type SidebarProps = {
  collapsed: boolean;
};

function isNavItemActive(
  pathname: string,
  href: string,
  activePathPrefixes?: string[],
): boolean {
  if (pathname === href) return true;
  if (!activePathPrefixes?.length) return false;
  for (const prefix of activePathPrefixes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

function navItemClassNames(
  collapsed: boolean,
  isActive: boolean,
): string {
  const base = collapsed
    ? "group flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
    : "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";
  const active = isActive
    ? collapsed
      ? " bg-primary/12 text-primary"
      : " bg-primary/10 text-primary hover:text-primary"
    : "";
  return base + active;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <aside
      className={
        "flex h-full min-h-0 shrink-0 flex-col border-r border-border/80 bg-background transition-[width] duration-200 ease-out " +
        (collapsed ? "w-[72px]" : "w-60")
      }
    >
      <div className="flex h-14 shrink-0 items-center border-b border-border/80 px-3">
        {!collapsed ? (
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center outline-none"
            aria-current={isHome ? "page" : undefined}
          >
            <Image
              src="/logo.svg"
              alt="Pixii"
              width={824}
              height={219}
              unoptimized
              priority
              className="h-6 w-auto max-w-full object-contain"
            />
          </Link>
        ) : (
          <div className="flex w-full justify-center">
            <Link
              href="/"
              className="flex items-center justify-center outline-none"
              aria-current={isHome ? "page" : undefined}
            >
              <Image
                src="/small.ico"
                alt="Pixii"
                width={24}
                height={24}
                unoptimized
                className="size-6 object-contain"
              />
            </Link>
          </div>
        )}
      </div>

      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        aria-label="Product areas"
      >
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.id}
            className={
              sectionIndex > 0 ? "mt-5 border-t border-border/70 pt-5" : ""
            }
          >
            {!collapsed && (
              <div className="mb-2 flex items-center gap-2 px-2">
                <SectionIcon sectionId={section.id} />
                <h2 className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {section.title}
                </h2>
              </div>
            )}
            <ul className={collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}>
              {section.items.map(({ label, href, Icon, activePathPrefixes }) => {
                const isActive = isNavItemActive(pathname, href, activePathPrefixes);
                return (
                  <li
                    key={`${section.id}-${label}`}
                    className={collapsed ? "flex w-full justify-center" : ""}
                  >
                    <Link
                      href={href}
                      title={collapsed ? `${section.title} · ${label}` : undefined}
                      className={navItemClassNames(collapsed, isActive)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={
                          "size-5 shrink-0 transition-colors " +
                          (isActive
                            ? "text-primary"
                            : "text-foreground/70 group-hover:text-primary")
                        }
                        aria-hidden
                      />
                      {!collapsed && (
                        <span className="min-w-0 truncate">{label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/80 p-3">
        <div
          className={
            "flex items-center gap-3 " + (collapsed ? "justify-center" : "")
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- demo avatar from stable URL */}
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(DEMO_USER_NAME)}&background=${AVATAR_BG}&color=fff&size=128`}
            alt={DEMO_USER_NAME}
            className="size-10 shrink-0 rounded-full ring-2 ring-background"
            width={40}
            height={40}
          />
          {!collapsed && (
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {DEMO_USER_NAME}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
