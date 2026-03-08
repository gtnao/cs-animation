import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PolygonClippingArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "polygon-clipping/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/polygon-clipping"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 凸多角形の切断
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "凸多角形の切断"}
      />
    </>
  );
}
