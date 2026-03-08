import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function InsertionSortArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "insertion-sort/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/insertion-sort"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Insertion Sort
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Insertion Sort"}
      />
    </>
  );
}
