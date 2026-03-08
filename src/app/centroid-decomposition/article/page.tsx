import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function CentroidDecompositionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "centroid-decomposition/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/centroid-decomposition"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 重心分解
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "重心分解"}
      />
    </>
  );
}
