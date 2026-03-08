import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MinCostFlowArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "min-cost-flow/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/min-cost-flow"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 最小費用流
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "最小費用流 (Primal-Dual)"}
      />
    </>
  );
}
