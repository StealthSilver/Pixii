import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { BetaFeatureNotice } from "@/components/BetaFeatureNotice";
import { GridBackdrop } from "@/components/GridBackdrop";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

export default function RoasterPage() {
  return (
    <div className="relative min-h-full overflow-x-hidden">
      <GridBackdrop />
      <div className="relative z-10 px-5 py-7 md:px-8 md:py-9">
        <BetaFeatureNotice />
        <header className="border-b border-border/70 pb-6">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Amazon
          </p>
          <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Roaster
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Critique listings, score copy, and generate UGC-style video scripts from
            an Amazon product URL—same grid shell and typography as the rest of
            Pixii.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
              Listing critique
            </span>
            <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
              Rewrites & video
            </span>
          </div>
        </header>

        <section className="mt-8 max-w-2xl">
          <article className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-[1px] dark:ring-white/[0.06]">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Open Roaster
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Paste a product link to run a full roast: video script, listing score,
              and suggested rewrites in one flow.
            </p>
            <Link href="/dashboard/roaster" className={`${primaryBtn} mt-5`}>
              Go to Roaster
              <FaArrowRight className="size-3.5" aria-hidden />
            </Link>
          </article>
        </section>
      </div>
    </div>
  );
}
