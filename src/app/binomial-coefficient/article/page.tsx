import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function BinomialCoefficientArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "binomial-coefficient/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/binomial-coefficient"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 二項係数 (mod p)
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "二項係数 (mod p)"}
      />
    </>
  );
}
