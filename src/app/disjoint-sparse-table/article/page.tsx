import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DisjointSparseTableArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "disjoint-sparse-table/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/disjoint-sparse-table"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Disjoint Sparse Table
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "Disjoint Sparse Table"}
      />
    </>
  );
}
