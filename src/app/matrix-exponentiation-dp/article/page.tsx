import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function MatrixExponentiationDPArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "matrix-exponentiation-dp/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/matrix-exponentiation-dp"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 行列累乗 DP
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "行列累乗 DP"}
      />
    </>
  );
}
