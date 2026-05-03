import { callClaude } from "@/lib/rufusTwin/claude";
import { extractJsonPayload } from "@/lib/rufusTwin/jsonParse";

export type BlogPost = {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  tags: string[];
  wordCount: number;
  readingTimeMinutes: number;
};

export async function generateBlogPost(
  transcript: string,
  videoTitle: string,
  channelName: string,
  youtubeUrl: string,
  videoDescription: string,
): Promise<BlogPost> {
  const snippet =
    transcript.length > 8000 ? transcript.slice(0, 8000) + "\n…" : transcript;

  const system = `You are an expert SEO content writer who specializes in converting video content into high-performing blog posts. You write in a clear, engaging style that both humans and search engines love. You structure content with proper headings, include relevant keywords naturally, and always provide genuine value to the reader.`;

  const userPrompt = `Convert this YouTube video transcript into a comprehensive SEO blog post.

Video title: ${videoTitle}
Channel: ${channelName}
Original URL: ${youtubeUrl}
Video description: ${videoDescription}

Transcript:
${snippet}

Write a complete blog post that:
1. Has an SEO-optimized title (different from the video title, more searchable)
2. Has a meta description of 150-160 chars
3. Has a compelling introduction that hooks the reader in the first paragraph
4. Is organized into 4-6 H2 sections that cover the main topics from the video
5. Each section should be 150-250 words
6. Includes a Key Takeaways section with 5-7 bullet points
7. Has a conclusion with a call to action
8. Naturally references the original video
9. Is written for humans first, SEO second
10. Total length: 1000-1500 words

Return ONLY a JSON object:
{
  "title": "SEO optimized blog title",
  "metaDescription": "150-160 char meta desc",
  "slug": "url-friendly-slug-from-title",
  "content": "full blog post in markdown format with proper # ## ### headings",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "wordCount": approximate word count as number,
  "readingTimeMinutes": ceil(wordCount / 200)
}`;

  const text = await callClaude({
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 8192,
    timeoutMs: 180_000,
  });

  let payload: string;
  try {
    payload = extractJsonPayload(text);
  } catch {
    throw new Error("Blog generation failed. Please try again.");
  }

  const obj = JSON.parse(payload) as Record<string, unknown>;
  const wordCount = Math.max(0, Math.round(Number(obj.wordCount ?? 0)));
  const readingTimeMinutes = Math.max(
    1,
    Math.ceil(wordCount / 200),
    Number(obj.readingTimeMinutes ?? 1),
  );

  return {
    title: String(obj.title ?? ""),
    metaDescription: String(obj.metaDescription ?? ""),
    slug: String(obj.slug ?? "blog-post"),
    content: String(obj.content ?? ""),
    tags: Array.isArray(obj.tags) ? obj.tags.map((t) => String(t)) : [],
    wordCount,
    readingTimeMinutes,
  };
}
