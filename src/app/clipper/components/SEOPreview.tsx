"use client";

type SEOPreviewProps = {
 siteName?: string;
 title: string;
 description: string;
 path?: string;
};

export function SEOPreview({
 siteName = "Pixii",
 title,
 description,
 path = "blog",
}: SEOPreviewProps) {
 return (
 <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
 <p className="text-xs font-medium text-muted-foreground">Search preview</p>
 <div className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 ring-1 ring-black/[0.03] dark:bg-muted/30 dark:ring-white/[0.06]">
 <p className="text-xs text-muted-foreground">
 {siteName} › {path}
 </p>
 <p className="mt-1 line-clamp-2 text-lg text-primary underline decoration-primary">
 {title}
 </p>
 <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
 </div>
 </div>
 );
}
