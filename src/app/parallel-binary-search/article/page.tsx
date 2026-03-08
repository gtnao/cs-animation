import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function ParallelBinarySearchArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "parallel-binary-search/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/parallel-binary-search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Parallel Binary Search
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Parallel Binary Search"}
      />
    </>
  );
}
