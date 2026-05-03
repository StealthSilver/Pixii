"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

type BlogContentProps = {
  markdown: string;
};

export function BlogContent({ markdown }: BlogContentProps) {
  const html = useMemo(() => marked.parse(markdown) as string, [markdown]);

  return (
    <article
      className={
        "blog-content max-w-none text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground " +
        "[&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground " +
        "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground " +
        "[&_li]:mb-1 [&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:font-semibold " +
        "[&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
