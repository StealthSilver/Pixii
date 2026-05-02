import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { FeaturePage } from "@/components/FeaturePage";

export default function StudioPage() {
  return (
    <FeaturePage
      title="Studio"
      description="Enhance low-quality images into professional studio-grade product photos."
    >
      <section className="mt-8 max-w-2xl">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-black">
            Photo Upgrader
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Turn rough marketplace snapshots into clean studio shots: upscale with
            Real-ESRGAN, remove the background, apply a seamless backdrop, then
            relight for commercial polish.
          </p>
          <Link
            href="/dashboard/photo-upgrader"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
          >
            Open Photo Upgrader
            <FaArrowRight className="size-3.5" aria-hidden />
          </Link>
        </article>
      </section>
    </FeaturePage>
  );
}
