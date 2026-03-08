import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MonotoneQueueArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "monotone-queue/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/monotone-queue"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Monotone Queue (Sliding Window Minimum)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Monotone Queue (Sliding Window Minimum)"}
      />
    </>
  );
}
