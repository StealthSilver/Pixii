import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { GridBackdrop } from "@/components/GridBackdrop";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

export default function RendererPage() {
  return (
    <div className="relative min-h-full overflow-x-hidden">
      <GridBackdrop />
      <div className="relative z-10 px-4 py-6 sm:px-5 sm:py-7 md:px-8 md:py-9">
        <header className="border-b border-border/70 pb-6">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Renderer
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            Packaging visuals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Turn packaging dielines into photorealistic 3D renders with AI—aligned
            with the Pixii grid shell and typography.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
              Dieline → 3D
            </span>
            <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground/90 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
              Fal · Replicate
            </span>
          </div>
        </header>

        <section className="mt-8 max-w-2xl">
          <article className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-[1px] dark:ring-white/[0.06]">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Packaging Renderer
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Upload a dieline PDF, pick a package shape and scene, and get
              studio-ready renders—texture extraction plus Fal.ai (with Replicate
              fallback).
            </p>
            <Link href="/dashboard/packaging-renderer" className={`${primaryBtn} mt-5`}>
              Open Packaging Renderer
              <FaArrowRight className="size-3.5" aria-hidden />
            </Link>
          </article>
        </section>
      </div>
    </div>
  );
}
