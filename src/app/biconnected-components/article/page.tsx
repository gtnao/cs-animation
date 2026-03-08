import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BiconnectedComponentsArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "biconnected-components/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/biconnected-components"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 二重頂点連結成分分解
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "二重頂点連結成分分解"}
      />
    </>
  );
}
