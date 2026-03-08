import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PolynomialLogExpArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "polynomial-log-exp/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/polynomial-log-exp"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 多項式の対数・指数
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "多項式の対数・指数"}
      />
    </>
  );
}
