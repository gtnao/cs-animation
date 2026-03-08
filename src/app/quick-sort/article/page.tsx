import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function QuickSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "quick-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/quick-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Quick Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Quick Sort"}
      />
    </>
  );
}
