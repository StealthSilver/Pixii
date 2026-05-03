import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { FeaturePage } from "@/components/FeaturePage";

export default function RendererPage() {
 return (
 <FeaturePage
 title="Renderer"
 description="Turn packaging dielines into photorealistic 3D product renders with AI."
 >
 <section className="mt-8 max-w-2xl">
 <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <h2 className="font-heading text-lg font-semibold text-foreground">
 Packaging Renderer
 </h2>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Upload a dieline PDF, pick a package shape and scene, and get studio-ready
 renders—texture extraction plus Fal.ai (with Replicate fallback).
 </p>
 <Link
 href="/dashboard/packaging-renderer"
 className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 Open Packaging Renderer
 <FaArrowRight className="size-3.5" aria-hidden />
 </Link>
 </article>
 </section>
 </FeaturePage>
 );
}
