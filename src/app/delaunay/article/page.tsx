import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function DelaunayArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "delaunay/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/delaunay"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ドロネー三角形分割
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "ドロネー三角形分割"}
      />
    </>
  );
}
