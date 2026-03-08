import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function GraphColoringArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "graph-coloring/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/graph-coloring"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← グラフ彩色
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "グラフ彩色"}
      />
    </>
  );
}
