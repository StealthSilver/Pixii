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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-neutral-500">Search preview</p>
      <div className="mt-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs text-neutral-600">
          {siteName} › {path}
        </p>
        <p className="mt-1 line-clamp-2 text-lg text-[#1a0dab] underline decoration-[#1a0dab]">
          {title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{description}</p>
      </div>
    </div>
  );
}
