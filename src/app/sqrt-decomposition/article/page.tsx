import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function SqrtDecompositionArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "sqrt-decomposition/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/sqrt-decomposition"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 平方分割
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "平方分割"}
      />
    </>
  );
}
