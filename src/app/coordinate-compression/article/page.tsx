import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function CoordinateCompressionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "coordinate-compression/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/coordinate-compression"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 座標圧縮
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "座標圧縮"}
      />
    </>
  );
}
