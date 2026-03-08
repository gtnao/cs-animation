import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function KnapsackUnboundedArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "knapsack-unbounded/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/knapsack-unbounded"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ナップサック問題 (個数無制限)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ナップサック問題 (個数無制限)"}
      />
    </>
  );
}
