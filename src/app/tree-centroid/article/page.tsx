import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function TreeCentroidArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "tree-centroid/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/tree-centroid"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 木の重心
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "木の重心"}
      />
    </>
  );
}
