import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BubbleSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bubble-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bubble-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Bubble Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Bubble Sort"}
      />
    </>
  );
}
