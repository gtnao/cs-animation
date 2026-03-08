import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BipartiteCheckArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bipartite-check/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bipartite-check"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 二部グラフ判定
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "二部グラフ判定"}
      />
    </>
  );
}
