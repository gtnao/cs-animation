import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function Knapsack01ArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "knapsack-01/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/knapsack-01"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ナップサック問題 (0-1)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ナップサック問題 (0-1)"}
      />
    </>
  );
}
