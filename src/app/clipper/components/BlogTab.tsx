"use client";

import { useMemo } from "react";
import { marked } from "marked";
import { BlogContent } from "./BlogContent";
import { SEOPreview } from "./SEOPreview";
import { downloadTextFile } from "@/lib/videoChopper/downloadTextFile";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

marked.setOptions({ breaks: true, gfm: true });

export type BlogPostPayload = {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
  tags: string[];
  generatedAt?: string;
};

type BlogTabProps = {
  blog: BlogPostPayload | null;
  loadingBlog: boolean;
  onToast: (message: string, variant: "success" | "error") => void;
};

export function BlogTab({ blog, loadingBlog, onToast }: BlogTabProps) {
  const htmlForCopy = useMemo(() => {
    if (!blog?.content) {
      return "";
    }
    return marked.parse(blog.content) as string;
  }, [blog?.content]);

  if (loadingBlog && !blog) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-8 text-sm text-neutral-600 shadow-sm">
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Generating blog post…
      </div>
    );
  }

  if (!blog) {
    return (
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
        Blog generation was skipped or isn&apos;t available for this job.
      </p>
    );
  }

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(blog.content);
      onToast("Markdown copied.", "success");
    } catch {
      onToast("Could not copy.", "error");
    }
  };

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlForCopy);
      onToast("HTML copied.", "success");
    } catch {
      onToast("Could not copy.", "error");
    }
  };

  const safeSlug = blog.slug.replace(/[^a-zA-Z0-9-_]/g, "-") || "blog-post";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-xl font-bold text-black">{blog.title}</h2>
        <p className="mt-2 text-sm italic text-neutral-500">{blog.metaDescription}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(blog.tags ?? []).map((t) => (
            <span
              key={t}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          {blog.wordCount.toLocaleString()} words · {blog.readingTimeMinutes} min read
          {blog.generatedAt ? (
            <>
              {" "}
              · Generated {formatRelativeTime(blog.generatedAt)}
            </>
          ) : null}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyMd()}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Copy Markdown
          </button>
          <button
            type="button"
            onClick={() => void copyHtml()}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Copy HTML
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(blog.content, `${safeSlug}.md`, "text/markdown;charset=utf-8")
            }
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Download .md
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                blog.content.replace(/[#*_`]/g, ""),
                `${safeSlug}.txt`,
                "text/plain;charset=utf-8",
              )
            }
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Download .txt
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <BlogContent markdown={blog.content} />
      </div>

      <SEOPreview title={blog.title} description={blog.metaDescription} path={blog.slug} />
    </div>
  );
}
