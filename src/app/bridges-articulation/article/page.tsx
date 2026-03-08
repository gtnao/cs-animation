import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BridgesArticulationArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "bridges-articulation/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/bridges-articulation"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 橋・関節点検出
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "橋・関節点検出"}
      />
    </>
  );
}
