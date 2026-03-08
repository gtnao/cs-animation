import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MatrixTreeTheoremArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "matrix-tree-theorem/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/matrix-tree-theorem"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 行列木定理 (Kirchhoff)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "行列木定理 (Kirchhoff)"}
      />
    </>
  );
}
