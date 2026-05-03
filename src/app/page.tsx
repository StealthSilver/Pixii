import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { NAV_SEARCH_INDEX } from "@/lib/navSearchIndex";

const apps = NAV_SEARCH_INDEX.filter((item) => item.id !== "home");

/** Short product lines for each tool (landing only). */
const APP_BLURBS: Record<string, string> = {
  hooks: "Surface winning angles and reuse them across listings.",
  aeo: "Preview how answer engines describe your brand and SKUs.",
  rufus: "Stress-test messaging against shopper-style questions.",
  roaster: "Roast copy and structure before you publish.",
  reviews: "Turn review text into themes and actionable fixes.",
  markets: "Estimate category size and where demand clusters.",
  creator: "Draft scripts, angles, and assets for campaigns.",
  ugc: "Generate UGC-style ads from personas and briefs.",
  clipper: "Extract clips, chapters, and posts from long video.",
  studio: "Upscale shots, swap backgrounds, and relight products.",
  renderer: "Visualize packaging and labels in consistent scenes.",
  shopify: "Keep store workflows next to Amazon and creative.",
};

/** Navbar is `h-14` (3.5rem); main content fills the rest of the viewport. */
const mainMinH = "min-h-[calc(100dvh-3.5rem)]";

export default function Home() {
  return (
    <div
      className={`relative flex ${mainMinH} flex-col overflow-x-hidden overflow-y-auto`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[length:26px_26px] opacity-[0.38] dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(0 0 0 / 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0 0 0 / 0.04) 1px, transparent 1px)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[length:26px_26px] opacity-[0.42] dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px)
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-18%,rgb(191_79_48_/_0.07),transparent_58%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-18%,rgb(224_122_85_/_0.09),transparent_58%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 py-7 md:px-10 md:py-9">
        <header className="shrink-0 border-b border-border/70 pb-6 md:pb-7">
          <Image
            src="/logo.svg"
            alt="Pixii"
            width={824}
            height={219}
            unoptimized
            priority
            className="h-7 w-auto max-w-full object-contain md:h-8"
          />
          <h1 className="mt-5 font-heading text-xl font-semibold tracking-tight text-foreground md:mt-6 md:text-2xl">
            One workspace for Amazon, content, and store ops.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
            Listing intelligence, creative production, and visual polish in one
            surface—built for teams shipping at marketplace speed.
          </p>
        </header>

        <section
          className="mt-8 flex min-h-0 flex-1 flex-col md:mt-10"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="shrink-0 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            What you can do
          </h2>

          <ul className="mx-auto mt-5 grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:mt-6 lg:grid-cols-4 lg:grid-rows-3 lg:gap-x-6 lg:gap-y-5 [&>li]:min-h-0">
            {apps.map(({ id, title, href, section }) => (
              <li key={id} className="min-h-0">
                <Link
                  href={href}
                  className="group flex h-full flex-col justify-between rounded-lg border border-border/80 bg-card/90 p-2.5 shadow-sm backdrop-blur-[2px] transition-[border-color,box-shadow,background-color] hover:border-primary/30 hover:bg-card hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 md:p-3"
                >
                  <div className="min-w-0">
                    <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                      {section}
                    </span>
                    <p className="mt-1 font-heading text-[0.8125rem] font-semibold leading-snug text-foreground md:text-sm">
                      {title}
                    </p>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-muted-foreground md:text-xs md:leading-relaxed">
                      {APP_BLURBS[id] ?? ""}
                    </p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    Open
                    <FaArrowRight
                      className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
