import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function PolynomialInverseArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "polynomial-inverse/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/polynomial-inverse"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 多項式の逆元・除算
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "多項式の逆元・除算"}
      />
    </>
  );
}
