import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MergeSortTreeArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "merge-sort-tree/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/merge-sort-tree"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Merge Sort Tree
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Merge Sort Tree"}
      />
    </>
  );
}
