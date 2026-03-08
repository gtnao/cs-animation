import { renderMarkdown } from "@/lib/markdown";
import { ArticleRenderer } from "@/components/article/article-renderer";
import Link from "next/link";

export default async function LinearBasisArticlePage() {
  const { content, frontmatter } = await renderMarkdown(
    "linear-basis/article.md"
  );

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/linear-basis"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← 線形基底 Linear Basis
        </Link>
      </div>
      <ArticleRenderer
        content={content}
        title={(frontmatter.title as string) || "線形基底 Linear Basis / XOR Basis"}
      />
    </>
  );
}
